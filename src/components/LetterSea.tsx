/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { Ship, Heart, Sparkles, Inbox, Trash2, Sailboat, Anchor, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { LetterOfComfort } from '../types';

// Helper function for displaying precise letter dates and times
const formatFullDateTime = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const date = d.getDate().toString().padStart(2, '0');
    const ampm = d.getHours() >= 12 ? '오후' : '오전';
    let hours = d.getHours() % 12;
    hours = hours ? hours : 12;
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${year}. ${month}. ${date}. ${ampm} ${hours}:${minutes}`;
  } catch (e) {
    return dateStr;
  }
};

export default function LetterSea() {
  const [letters, setLetters] = useState<LetterOfComfort[]>([]);

  const [worryText, setWorryText] = useState('');
  const [theme, setTheme] = useState<'ocean' | 'sunset' | 'forest' | 'starlight'>('ocean');
  const [isSending, setIsSending] = useState(false);
  const [activeLetter, setActiveLetter] = useState<LetterOfComfort | null>(null);
  const [readingArchiveId, setReadingArchiveId] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Load from persistent backend DB on mount
  useEffect(() => {
    let isMounted = true;
    fetch('/api/counsel/data')
      .then(res => res.json())
      .then(data => {
        if (isMounted && data && Array.isArray(data.letters)) {
          setLetters(data.letters);
        }
       })
       .catch(err => console.error('Failed to load letters from server database:', err));
    return () => { isMounted = false; };
  }, []);

  // Offline backup fallback
  useEffect(() => {
    try {
      localStorage.setItem('mind_center_letters', JSON.stringify(letters));
    } catch (err) {
      console.error('Failed to save comfort letters to localStorage:', err);
    }
  }, [letters]);

  const handleThrowBottle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!worryText.trim() || isSending) return;

    setIsSending(true);
    setErrorText(null);
    setActiveLetter(null);

    try {
      const response = await fetch('/api/counsel/comfort-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ worryText, theme }),
      });

      if (!response.ok) {
        throw new Error('바다의 파도가 거세어 위로의 서신을 띄우지 못했습니다. 잠시 후 감정을 부드럽게 고르고 시도해주세요.');
      }

      const newLetter = await response.json();

      setLetters(prev => [newLetter, ...prev]);
      setActiveLetter(newLetter);
      setWorryText('');
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || '네트워크 장애가 생겼습니다. 심호흡 후 차분히 고민을 다시 날려보세요.');
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteLetter = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('이 위로의 서신을 마음에서 완전히 흘려보내 지우시겠습니까?')) {
      try {
        const response = await fetch(`/api/counsel/letters/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          setLetters(prev => prev.filter(l => l.id !== id));
          if (activeLetter?.id === id) setActiveLetter(null);
          if (readingArchiveId === id) setReadingArchiveId(null);
        } else {
          throw new Error('서버에서 편지 서신 삭제를 실패했습니다.');
        }
      } catch (err: any) {
        console.error(err);
        alert(err.message || '서신 삭제 진행 도중 서버 흐름에 오류가 있었습니다.');
      }
    }
  };

  const getThemeDetails = (themeKey: string) => {
    switch (themeKey) {
      case 'sunset':
        return {
          title: '노을 지는 따뜻한 바다',
          desc: '수고한 하루 끝을 채워주는 붉고 온화한 저녁노을빛 조언',
          bg: 'bg-gradient-to-b from-orange-500/10 via-rose-500/10 to-transparent border-rose-200 dark:border-rose-900/30',
          accent: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/50',
          glassBg: 'bg-orange-50/90 dark:bg-slate-900/95 border-amber-300/30'
        };
      case 'forest':
        return {
          title: '풀 내음 아늑한 숲바람',
          desc: '초록 나뭇잎 사이로 흩날리는 피톤치드 가득한 청록빛 수용',
          bg: 'bg-gradient-to-b from-emerald-500/10 via-teal-500/10 to-transparent border-emerald-200 dark:border-emerald-900/30',
          accent: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50',
          glassBg: 'bg-emerald-50/90 dark:bg-slate-900/95 border-emerald-300/30'
        };
      case 'starlight':
        return {
          title: '별빛 총총한 밤바다',
          desc: '끝없는 어둠 속을 잔잔히 메워주는 맑고 찬란한 밤하늘 총총 조력',
          bg: 'bg-gradient-to-b from-indigo-500/10 via-purple-500/10 to-transparent border-indigo-200 dark:border-indigo-900/30',
          accent: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/50',
          glassBg: 'bg-indigo-50/90 dark:bg-slate-900/95 border-indigo-300/30'
        };
      default: // ocean
        return {
          title: '넓고 푸르른 치유의 심해',
          desc: '고민의 흙탕물을 가라앉혀 씻어주는 아늑하고 깊은 바다 지지',
          bg: 'bg-gradient-to-b from-blue-500/10 via-cyan-500/10 to-transparent border-blue-200 dark:border-blue-900/30',
          accent: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40 border border-blue-200/50',
          glassBg: 'bg-blue-50/90 dark:bg-slate-900/95 border-blue-300/30'
        };
    }
  };

  const renderActiveLetterContent = (letter: LetterOfComfort) => {
    const config = getThemeDetails(letter.colorTheme);
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`mt-6 p-6 sm:p-8 rounded-2xl border-2 shadow-lg max-w-3xl mx-auto backdrop-blur-md relative overflow-hidden transition-all ${config.glassBg}`}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-current opacity-[0.015] blur-2xl rounded-full" />
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-4 mb-5">
          <div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mb-1 ${config.accent}`}>
              {config.title}
            </span>
            <h4 className="text-xs font-mono text-slate-400">
              띄워 올린 바다 일시: {formatFullDateTime(letter.createdAt)}
            </h4>
          </div>
          <button
            onClick={() => {
              setActiveLetter(null);
              setReadingArchiveId(null);
            }}
            className="text-xs px-3 py-1.5 bg-slate-100 dark:bg-slate-800 font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors shrink-0 cursor-pointer"
          >
            서신 보관함에 넣고 닫기
          </button>
        </div>

        {/* Written worry review */}
        <div className="bg-slate-100/60 dark:bg-slate-950/40 rounded-xl p-3 border border-slate-200/20 mb-6">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">
            내가 실어 흘려보냈던 일간 고민:
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
            "{letter.worryText}"
          </p>
        </div>

        {/* AI Letter - Markdown Rendered */}
        <div className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed prose prose-slate dark:prose-invert max-w-none break-all font-sans select-text">
          <ReactMarkdown>{letter.responseLetter || ''}</ReactMarkdown>
        </div>

        <div className="mt-8 pt-5 border-t border-slate-200/50 dark:border-slate-850/20 flex justify-center text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Anchor className="w-3.5 h-3.5 text-indigo-400" /> 서신이 마음밭에 깊은 뿌리를 내리기를 빌게요.
          </span>
        </div>
      </motion.div>
    );
  };

  return (
    <div id="letter_sea_root" className="w-full flex flex-col gap-6 p-1">
      
      {/* Outer sea background box styling */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-950 relative overflow-hidden flex flex-col md:flex-row gap-6">
        {/* Animated fluid sky backdrop */}
        <div className="absolute inset-0 bg-radial-gradient from-blue-950 via-slate-950 to-slate-950" />
        
        {/* Vector wave layer animations */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1440 320%22><path fill=%22%230f172a%22 fill-opacity=%220.4%22 d=%22M0,288L60,282.7C120,277,240,267,360,250.7C480,235,600,213,720,202.7C840,192,960,192,1080,202.7C1200,213,1320,235,1380,245.3L1440,256L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z%22></path></svg>')] bg-cover opacity-60 pointer-events-none" />

        {/* Worry Bottle Inputs */}
        <div className="flex-1 relative z-10 flex flex-col justify-center">
          <h3 className="text-lg font-bold text-teal-400 flex items-center gap-2 mb-2">
            <Sailboat className="w-5 h-5" /> 고민 메아리: 편지 바다
          </h3>
          <p className="text-xs text-slate-300 leading-normal mb-5">
            어디에도 속시원히 털어놓지 못하고 꽁꽁 동여맨 일상의 상처를 가만히 적어 바다로 띄우세요. 파도가 감싸 안아 따뜻한 문학적 서신으로 답해 드립니다.
          </p>

          <form onSubmit={handleThrowBottle} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                바다로 띄워 보내고 싶은 아픔 적기
              </label>
              <textarea
                rows={4}
                value={worryText}
                onChange={(e) => setWorryText(e.target.value)}
                placeholder="오늘 나를 짓누르는 깊은 고민이 있다면 이곳에 털어놓으세요... 파도가 고민을 멀리 흘려보내 드립니다."
                maxLength={600}
                required
                disabled={isSending}
                className="w-full px-3.5 py-3 rounded-xl text-sm bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:bg-slate-950 transition-all resize-none leading-relaxed"
              />
            </div>

            {/* Ocean Themes Selectors */}
            <div className="grid grid-cols-2 gap-2">
              {(['ocean', 'sunset', 'forest', 'starlight'] as const).map((t) => {
                const info = getThemeDetails(t);
                const isActive = theme === t;
                return (
                  <button
                    type="button"
                    key={t}
                    onClick={() => setTheme(t)}
                    disabled={isSending}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      isActive
                        ? 'border-teal-400 bg-teal-950/20 text-teal-300 shadow-sm'
                        : 'border-slate-800 bg-slate-950/30 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xs font-bold">{info.title}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 block mt-0.5">
                      {info.desc}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="submit"
              disabled={!worryText.trim() || isSending}
              className="w-full py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-40 disabled:pointer-events-none text-sm flex items-center justify-center gap-1.5"
            >
              <Ship className="w-4 h-4 shrink-0" /> 위로의 서신 바다에 띄우기
            </button>
          </form>

          {/* Connected error info */}
          {errorText && (
            <div className="mt-3 p-3 bg-rose-950/30 border border-rose-900/40 rounded-xl flex items-start gap-2 text-rose-300 text-xs shadow-xs">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <div>{errorText}</div>
            </div>
          )}
        </div>

        {/* Visual Animation Ocean State */}
        <div className="flex-1 min-h-[220px] relative z-10 flex flex-col items-center justify-center bg-slate-950/40 rounded-xl border border-slate-800/40 p-4">
          <AnimatePresence mode="wait">
            {isSending ? (
              <motion.div
                key="sending-state"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center space-y-4 max-w-sm"
              >
                {/* Floating bottle wrap animation */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="text-6xl text-center select-none"
                >
                  🍾
                </motion.div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-teal-300 animate-pulse">
                    고민을 샴페인병에 담아 먼바다로 보내는 중...
                  </p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    바람이 거리를 헤아리고 파도가 아늑한 등대 주위를 맴돌며, 당신의 사연에 아로새겨질 푸른 위로의 서신을 밀접하게 조율하고 있습니다.
                  </p>
                </div>
              </motion.div>
            ) : activeLetter ? (
              <motion.div
                key="letter-arrived"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center space-y-4"
              >
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0], y: [0, -4, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="text-6xl text-center cursor-pointer select-none"
                  onClick={() => setReadingArchiveId(activeLetter.id)}
                >
                  💌
                </motion.div>
                <div>
                  <p className="text-sm font-bold text-amber-300">
                    그윽한 위로의 편지가 파도를 타고 돌아왔습니다!
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    위의 편지 봉투를 꼼꼼히 클릭하거나 아래의 서신 내용을 아래 창에서 읽어보세요.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="idle-stage"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center space-y-2 text-slate-400"
              >
                <Anchor className="w-12 h-12 stroke-1 hover:stroke-2 mx-auto text-slate-600 animate-pulse" />
                <p className="text-xs font-semibold text-slate-400">
                  아직 띄워 보낸 편지가 바다에 정박해 있습니다.
                </p>
                <p className="text-[10px] text-slate-500 max-w-xs leading-normal">
                  왼쪽 양식에 지친 고민거리를 하나 적고 분위기 테마를 선택해 바다에 던져보세요.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Comfort Letter Reading Room */}
      <AnimatePresence>
        {activeLetter && renderActiveLetterContent(activeLetter)}
      </AnimatePresence>

      {/* Archive comfort box of user letters */}
      <div id="archives_box" className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 mt-3">
        <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-4 flex items-center gap-1.5">
          <Inbox className="w-4 h-4 text-indigo-400" /> 나의 마음 조력 서신 보관함
        </h4>

        {letters.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-400">
            🌅 당신을 포근히 안아주었던 편지 보관 기록이 아직 비어 있습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {letters.map((letter) => {
              const themeDetails = getThemeDetails(letter.colorTheme);
              const isCurrentlyReading = readingArchiveId === letter.id;
              
              return (
                <div
                  key={letter.id}
                  onClick={() => {
                    setReadingArchiveId(letter.id);
                    setActiveLetter(letter);
                  }}
                  className={`p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 hover:bg-slate-100/50 dark:hover:bg-slate-900/50 transition-all cursor-pointer relative group flex flex-col justify-between ${
                    isCurrentlyReading ? 'ring-1 ring-teal-400 border-teal-200' : ''
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full inline-block ${themeDetails.accent}`}>
                        {themeDetails.title}
                      </span>
                      <button
                        onClick={(e) => handleDeleteLetter(letter.id, e)}
                        className="text-slate-300 hover:text-rose-500 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                        title="서신 폐기"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 font-mono mb-2">
                      {formatFullDateTime(letter.createdAt)}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed break-all">
                      "{letter.worryText}"
                    </p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-800 flex justify-end">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-0.5">
                      {isCurrentlyReading ? (
                        <>
                          읽는 중 <EyeOff className="w-3.5 h-3.5" />
                        </>
                      ) : (
                        <>
                          다시 읽기 <Eye className="w-3.5 h-3.5" />
                        </>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
