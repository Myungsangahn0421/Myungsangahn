/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

// Path to persistent counseling database
const DB_FILE = path.join(process.cwd(), 'counseling_db.json');

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  createdAt: string;
}

interface DiaryEntry {
  id: string;
  date: string;
  mood: string;
  intensity: number;
  note: string;
  createdAt: string;
}

interface LetterOfComfort {
  id: string;
  worryText: string;
  responseLetter: string | null;
  createdAt: string;
  colorTheme: string;
}

interface StressAnalysis {
  categoryCounts: {
    relationship: number;
    workAcademic: number;
    family: number;
    healthSelf: number;
    financeFuture: number;
    others: number;
  };
  primaryStressCategory: string;
  stressScore: number;
  analysisDescription: string;
  actionPlan: string[];
  tailoredCounselingGuide: string;
  updatedAt: string;
}

interface DBData {
  chats: Record<string, ChatMessage[]>;
  diaries: DiaryEntry[];
  letters: LetterOfComfort[];
  stressAnalysis?: StressAnalysis | null;
}

// Read database file safely
function readDB(): DBData {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(content);
      if (!data.stressAnalysis) {
        data.stressAnalysis = null;
      }
      return data;
    }
  } catch (error) {
    console.error('Error reading database file:', error);
  }
  return { chats: {}, diaries: [], letters: [], stressAnalysis: null };
}

// Write to database file safely
function writeDB(data: DBData): void {
  try {
    const parentDir = path.dirname(DB_FILE);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing to database file:', error);
  }
}

// Set up Google GenAI Client with custom User-Agent headers
const aiClient = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

app.use(express.json());

// API: Heartbeat
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// API: Batch Load All Server Data (Sync state at client start)
app.get('/api/counsel/data', (req: Request, res: Response) => {
  try {
    const db = readDB();
    res.json(db);
  } catch (error: any) {
    res.status(500).json({ error: '서버 데이터 로딩 실패', details: error.message });
  }
});

// API: Get Stress Analysis Status/Result
app.get('/api/counsel/stress-analysis', (req: Request, res: Response) => {
  try {
    const db = readDB();
    res.json(db.stressAnalysis || null);
  } catch (error: any) {
    res.status(500).json({ error: '스트레스 분석 정보 조회 실패', details: error.message });
  }
});

// API: Run Live AI Stress Analysis using Gemini 3.5 Flash
app.post('/api/counsel/analyze-stress', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({ error: 'Gemini API key is missing on the server. Please check settings.' });
      return;
    }

    const db = readDB();

    // Compile chat logs as user utterances corpus
    const chatEntries: string[] = [];
    Object.entries(db.chats).forEach(([cId, msgs]) => {
      // Find clean human names for logging
      const counselorNames: Record<string, string> = { daon: '다온', mua: '무아', eunyul: '은율', mongi: '몽이' };
      const cName = counselorNames[cId] || cId;
      const userMsgs = msgs.filter(m => m.sender === 'user').map(m => m.text);
      if (userMsgs.length > 0) {
        chatEntries.push(`[상담원 ${cName}와 나눈 대화 기록]:\n- ` + userMsgs.join('\n- '));
      }
    });

    // Compile diary entries as corpus
    const diaryEntries: string[] = [];
    db.diaries.forEach(d => {
      diaryEntries.push(`[감정 일지 (${d.date}, 상황설명: ${d.mood}, 고괴로움지수: ${d.intensity}/5)]: ${d.note}`);
    });

    const textCorpus = [...chatEntries, ...diaryEntries].join('\n\n');

    const systemPrompt = `당신은 마음상담 전문가이자 친근하고 통찰력 있는 AI 심리분석관입니다.
사용자가 상담가들과 나눈 대화 기록 및 감정 일지를 바탕으로 사용자의 주요 스트레스 분야를 분류하고 심리적 특성을 종합 분석해 주십시오.

스트레스 테마분류 범주:
1. 대인관계/갈등 (relationship): 친구, 연인, 동료, 부부가 겪는 상처, 소외감, 감정 불화.
2. 직장/학업 (workAcademic): 과도한 마일스톤, 야근, 부적응, 취직 실패, 장벽, 피로감.
3. 가족/가정 (family): 부모님과의 불화, 자녀 걱정, 가사 분담 등 혈연이나 실질 가정이 주는 마음의 짐.
4. 자아/심신 건강 (healthSelf): 우울, 피곤, 자책, 낮은 자존감, 불면증, 건강 악화 등 나에 집중된 아픔.
5. 경제/미래 (financeFuture): 생활 주택대출, 미래에 관한 불투명, 진로 우려, 물가 변동.
6. 기타 (others): 기타 짧고 가벼운 안부나 무목적적 대화.

[임상 정밀 규칙]
1. 사용자의 텍스트 기록이 전혀 없거나 한두 마디 뿐인 경우:
   - categoryCounts 내 각 점수를 standard 기본 형태(relationship: 15, workAcademic: 20, family: 15, healthSelf: 20, financeFuture: 15, others: 15)로 깔끔하게 구성하십시오.
   - primaryStressCategory 필드는 반드시 "데이터 축적 중"으로 적어주십시오.
   - analysisDescription 란에는 "아직 소소하게 나눈 대화나 기록한 일지가 적어 세심하게 속마음을 읽기 전입니다. 다온, 뮤아 등 마음 상담소의 귀여운 동반자들을 찾아가 툭 터놓고 이야기해 보세요. 따듯한 분석을 들려 드릴게요."라고 친근하고 부드러운 한국어로 기재하십시오.
   - actionPlan에는 "마음에 드는 상담가 선택하여 짧게 위로받기", "감정 모드를 통해 일지 1회 남겨보기", "호흡 가이드 탭에서 가슴 가라앉히기" 등의 3개 요소를 한국어 문자열 배열로 넣어주십시오.
   - tailoredCounselingGuide 에는 AI 상담가들이 수용적인 분위기로 깊은 경청 서비스를 제공할 준비가 되었음을 나타내는 따뜻한 조언 한 줄을 한국어로 적어 주십시오.

2. 사용자의 텍스트 기록이 풍성한 경우:
   - 모든 대화와 일지를 꼼꼼히 역추적하여 각 스트레스 분야별 점수 비중을 0-100 단위로 기재해 주세요. (가장 주요하게 언급된 것이 점수가 높아야 합니다)
   - primaryStressCategory 는 가장 점수가 높은 스트레스 부면의 대표 한국어 명칭(대인관계/갈등, 직장/학업, 가족/가정, 자아/심신 건강, 경제/미래 중 하나)으로 정확히 적어주십시오.
   - stressScore 는 전반적인 정서적 긴장이나 괴로움의 심각한 수준을 0에서 100 사이 숫자로 마음 속 깊이를 환산해 보편적이면서도 타당성 있게 책정해 주십시오.
   - analysisDescription 에는 전문적이면서도 비유적이고, 가슴 시린 눈물을 감싸 안는 장문의 따스한 임상 분석 총평 리포트를 한국어로 정성스레 기재하십시오.
   - actionPlan 에는 3가지 실용적이고 따스한 셀프 행복 행동 처방(힐링 강령)을 한국어로 작성하십시오.
   - tailoredCounselingGuide 에는 AI 상담원 4명(다온, 뮤아, 은율, 몽이) 각각이 이 사람의 지배적 공포나 아픔을 대할 때 어떤 화술로 경청하고 조화롭게 상담을 업그레이드해야 하는지 행동 수칙과 원칙들을 전문 한국어로 조언해 주십시오.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `다음은 사용자가 남긴 마음 검사용 데이터입니다:\n\n---\n${textCorpus || '데이터 없음'}\n---`,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            categoryCounts: {
              type: Type.OBJECT,
              properties: {
                relationship: { type: Type.INTEGER, description: "관계 스트레스 점수 (0-100)" },
                workAcademic: { type: Type.INTEGER, description: "학업/직장 스트레스 점수 (0-100)" },
                family: { type: Type.INTEGER, description: "가족/가정 스트레스 점수 (0-100)" },
                healthSelf: { type: Type.INTEGER, description: "자아/건강 스트레스 점수 (0-100)" },
                financeFuture: { type: Type.INTEGER, description: "경제/미래 스트레스 점수 (0-100)" },
                others: { type: Type.INTEGER, description: "기타 스트레스 점수 (0-100)" },
              },
              required: ["relationship", "workAcademic", "family", "healthSelf", "financeFuture", "others"]
            },
            primaryStressCategory: { type: Type.STRING, description: "가장 주된 스트레스 분야 명칭" },
            stressScore: { type: Type.INTEGER, description: "종합 스트레스 지수 (0-100)" },
            analysisDescription: { type: Type.STRING, description: "마음의 위로와 깊이 있는 임상적 종합 분석 총평" },
            actionPlan: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "힐링 행복 처방 3가지 행동 강령 목록"
            },
            tailoredCounselingGuide: { type: Type.STRING, description: "AI 상담원들을 안내하는 마음 상담 활용 지침 및 행동강령" }
          },
          required: ["categoryCounts", "primaryStressCategory", "stressScore", "analysisDescription", "actionPlan", "tailoredCounselingGuide"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error('Gemini stress analyzer returned empty response.');
    }

    const saData = JSON.parse(resultText.trim());

    // Update DB
    db.stressAnalysis = {
      ...saData,
      updatedAt: new Date().toISOString()
    };
    writeDB(db);

    res.json(db.stressAnalysis);
  } catch (error: any) {
    console.error('Stress analysis operation failed:', error);
    res.status(500).json({ error: '스트레스 데이터 정밀 분석 중 오류 발생', details: error.message });
  }
});

// API: Sync Chat History for a Counselor
app.post('/api/counsel/chats/:counselorId', (req: Request, res: Response) => {
  try {
    const { counselorId } = req.params;
    const { messages } = req.body;

    if (!Array.isArray(messages)) {
      res.status(400).json({ error: 'Messages must be a valid array.' });
      return;
    }

    const db = readDB();
    db.chats[counselorId] = messages;
    writeDB(db);
    res.json({ success: true, counselorId });
  } catch (error: any) {
    res.status(500).json({ error: '대화 동기화 오류', details: error.message });
  }
});

// API: Save new mental diary entry
app.post('/api/counsel/diaries', (req: Request, res: Response) => {
  try {
    const { date, mood, intensity, note } = req.body;

    if (!note || !date || !mood) {
      res.status(400).json({ error: 'Missing required diary notes, date, or mood fields.' });
      return;
    }

    const db = readDB();
    const newEntry: DiaryEntry = {
      id: 'diary-' + Date.now(),
      date,
      mood,
      intensity: Number(intensity) || 3,
      note,
      createdAt: new Date().toISOString()
    };

    db.diaries.unshift(newEntry);
    writeDB(db);
    res.json(newEntry);
  } catch (error: any) {
    res.status(500).json({ error: '일지 저장 오류', details: error.message });
  }
});

// API: Delete specific diary log
app.delete('/api/counsel/diaries/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = readDB();
    db.diaries = db.diaries.filter(d => d.id !== id);
    writeDB(db);
    res.json({ success: true, deletedId: id });
  } catch (error: any) {
    res.status(500).json({ error: '일지 삭제 실패', details: error.message });
  }
});

// API: Delete specific comfort letter
app.delete('/api/counsel/letters/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = readDB();
    db.letters = db.letters.filter(l => l.id !== id);
    writeDB(db);
    res.json({ success: true, deletedId: id });
  } catch (error: any) {
    res.status(500).json({ error: '서신 삭제 실패', details: error.message });
  }
});

// API: Secure AI Chat Counseling with Counselor Persona
app.post('/api/counsel/chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const { messages, systemPrompt } = req.body;

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'Messages array is required.' });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({ error: 'Gemini API key is missing on the server. Please check settings.' });
      return;
    }

    // Adapt messages for Gemini SDK format
    const contents = messages
      .filter((msg: any) => msg.text && msg.sender)
      .map((msg: any) => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      }));

    if (contents.length === 0) {
      res.status(400).json({ error: 'No valid message contents found.' });
      return;
    }

    // Fetch stored DB to extract stress analysis details and dynamically upgrade counseling context
    const db = readDB();
    let dynamicSystemPrompt = systemPrompt || 'You are a compassionate counselor. Speak in warm, supportive Korean.';
    
    if (db.stressAnalysis && db.stressAnalysis.primaryStressCategory && db.stressAnalysis.primaryStressCategory !== "데이터 축적 중") {
      const sa = db.stressAnalysis;
      dynamicSystemPrompt += `\n\n[실시간 맞춤 처방 업그레이드 - 사용자의 최근 심리 분석 및 스트레스 진단서]
- 종합 스트레스 수준: ${sa.stressScore}/100 점
- 주된 고뇌 및 격통 원인: [${sa.primaryStressCategory}] 분야
- AI 정밀 분석 및 공평 리포트 핵심: ${sa.analysisDescription}
- 행동 실천 제안: ${sa.actionPlan.join(', ')}
- 상담사 맞춤 융합 조언: ${sa.tailoredCounselingGuide}

대화 중 "내가 조사해 본 바로는~" 혹은 "분석 결과지를 보니~" 같은 냉랭하거나 비인격적인 직접적인 평가는 절대 드러내지 마십시오. 대신, 이 고도의 정서 분석 데이터들을 당신의 상담가 아바타 페르소나 배역 안에 그대로 체득하고 스며들게 한 상태에서, 사용자가 호소하는 고민에 한층 더 밀도 높고 포근하게 대처하십시오. 특히 [${sa.primaryStressCategory}] 관점의 스트레스를 아주 부드럽고 다정하게 감싸 안는 방식으로 당신의 말과 정서적 수용 체계를 맞춤 업그레이드하십시오.`;
    }

    // Call Gemini 3.5 Flash (ideal for conversational, high-empathy dialog)
    const response = await aiClient.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: contents,
      config: {
        systemInstruction: dynamicSystemPrompt,
        temperature: 0.8,
        topP: 0.9,
      },
    });

    res.json({
      text: response.text || '말씀을 곱씹어 보고 있어요. 제가 조금 더 귀 기울여 들어드릴 테니 편히 말씀해 주세요.',
    });
  } catch (error: any) {
    console.error('Gemini chat counselor failed:', error);
    res.status(500).json({
      error: '상담가와 연결이 지연되고 있습니다. 잠시 후 가만히 심호흡을 하신 뒤 다시 시도해주세요.',
      details: error.message,
    });
  }
});

// API: Write custom poetic Letter of Comfort based on user worry
app.post('/api/counsel/comfort-letter', async (req: Request, res: Response): Promise<void> => {
  try {
    const { worryText, theme } = req.body;

    if (!worryText || worryText.trim() === '') {
      res.status(400).json({ error: 'worryText parameter is required.' });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({ error: 'Gemini API key is missing on the server.' });
      return;
    }

    const themePrompts: Record<string, string> = {
      ocean: '깊고 푸르고 잔잔하게 밀려오는 파도 소리와 바다 내음, 마음을 씻어주는 아늑한 해변의 모티브를 섞어 위로하세요.',
      sunset: '모든 힘겨움을 안은 채 저물어 가는 따스하고 붉은 저녁노을, 오늘 수고를 가라앉히는 차분한 저녁빛을 모티브로 편지를 작성해 주세요.',
      forest: '피톤치드가 가득한 울창한 초록 숲길, 가만히 스치는 바람, 흔들리는 나뭇잎들이 속삭이는 아늑한 초록빛 쉼터를 모티브로 삼으세요.',
      starlight: '칠흑 같은 어둠 속에서도 나만을 위해 소리 없이 반짝이는 아득하고 위로가 되는 밤하늘 무수한 별빛과 위로의 서사를 담아내 주세요.',
    };

    const chosenThemePrompt = themePrompts[theme || 'ocean'];

    const prompt = `사용자가 깊이 고뇌하며 작성한 일상의 피로와 고충(고민 내용)을 듣고, 마음을 어루만져 주는 장문의 따뜻한 '위로의 편지(Letter of Comfort)'를 사랑과 존중을 담아 정중한 경어체로 한 통 서사하십시오.

[사용자의 고민]
"${worryText}"

[편지 스타일 및 연출 규칙]
1. 고민의 속상함 and 아픔의 단면을 심오하고 섬세하게 경청하고 공감해 주세요.
2. 섣부른 훈계나 "이렇게 행동해라" 같은 해결 중심 가이드는 절대 삼가고, 상대방이 지금 이대로도 소중하고 충분하며 너무나 잘 견뎌내고 있음을 일깨워 정서적 안식처를 주세요.
3. 테마 분위기에 맞추어 아주 문학적이고, 마음을 편하게 만드는 고품격 비유를 풍성히 사용해 주십시오. (이 분위기 모티브를 자연스럽게 묘사해주세요: ${chosenThemePrompt})
4. 편지의 마지막에는 "지친 당신의 내일을 위해 늘 켜져 있는 등대 드림"처럼 포근하게 마음을 맺어주는 인사말을 덧붙이세요.
5. Markdown 형식을 예쁘고 가독성 좋게 도입하여 읽기만 해도 힐링이 되도록 장식해주세요. 줄바꿈을 넉넉히 사용하여 가독성을 높여주세요.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        temperature: 0.9,
        topP: 0.95,
      },
    });

    const letterContent = response.text || '따뜻하게 밀려오는 파도 줄기에 고민을 실어 보냈습니다. 당신의 지친 마음이 가닿아 언제나 편안해지기를 바랍니다.';

    // Create & Auto-Save letter instance directly to server DB
    const db = readDB();
    const newLetter: LetterOfComfort = {
      id: 'letter-' + Date.now(),
      worryText,
      responseLetter: letterContent,
      createdAt: new Date().toISOString(),
      colorTheme: theme || 'ocean'
    };

    db.letters.unshift(newLetter);
    writeDB(db);

    res.json(newLetter);
  } catch (error: any) {
    console.error('Gemini comfort-letter generator failed:', error);
    res.status(500).json({
      error: '위로의 편지 배달이 바다 소용돌이에 막혔습니다. 조금 조용해진 뒤 다시 편지를 띄워주세요.',
      details: error.message,
    });
  }
});

// Setup Vite Dev server middleware or static serve
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite development server middleware loaded.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Serving production build folder.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[마음 상담소 Server] Listening on http://localhost:${PORT}`);
  });
}

startServer();

