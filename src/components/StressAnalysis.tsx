/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Brain, Sparkles, RefreshCw, AlertCircle, CheckCircle2, 
  Heart, BookOpen, Home, User, TrendingUp, HelpCircle, 
  Activity, CheckSquare, Square, Info
} from 'lucide-react';

interface StressAnalysisData {
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

export default function StressAnalysis() {
  const [analysis, setAnalysis] = useState<StressAnalysisData | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [progressIdx, setProgressIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [completedActions, setCompletedActions] = useState<Record<number, boolean>>({});

  // Loading process texts
  const progressTexts = [
    '과거 대화상자에서 마음의 조각들을 정밀하게 추출해 내는 중...',
    '감정 일지에서 고뇌의 빈도와 슬픔 지표들을 스캔하는 중...',
    '주된 스트레스 유발 핵심 테마를 분류 모델로 진단하는 중...',
    '4인의 마음 상담가들을 위한 맞춤 심리 대처 지침을 수립하는 중...'
  ];

  const fetchAnalysis = () => {
    fetch('/api/counsel/stress-analysis')
      .then(res => {
        if (!res.ok) throw new Error('데이터 검색에 실패했습니다.');
        return res.json();
      })
      .then(data => {
        if (data) {
          setAnalysis(data);
        }
      })
      .catch(err => console.error('Error fetching initial stress analysis:', err));
  };

  useEffect(() => {
    fetchAnalysis();
  }, []);

  const runAnalysis = async () => {
    setIsRunning(true);
    setError(null);
    setProgressIdx(0);
    setCompletedActions({});
    
    // Simulate thinking steps dynamically
    const interval = setInterval(() => {
      setProgressIdx(prev => (prev < 3 ? prev + 1 : prev));
    }, 1500);

    try {
      const res = await fetch('/api/counsel/analyze-stress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        throw new Error('대화 및 일기 데이터가 누적되지 않았거나, 분석 연산에 오류가 생겼습니다.');
      }
      const data = await res.json();
      setAnalysis(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || '마음 진단에 실패했습니다. 대화를 먼저 가볍게 시작한 뒤 다시 검사해 보세요.');
    } finally {
      clearInterval(interval);
      setIsRunning(false);
    }
  };

  const handleToggleAction = (idx: number) => {
    setCompletedActions(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  // Stress theme colors and icons mapping
  const themeConfig = {
    relationship: { label: '대인관계 및 갈등 / 소외', icon: <Heart className="w-4 h-4 text-rose-500" />, color: 'bg-rose-500', text: 'text-rose-500', barBg: 'bg-rose-50' },
    workAcademic: { label: '학업 및 직장 / 미래진로', icon: <BookOpen className="w-4 h-4 text-amber-500" />, color: 'bg-amber-500', text: 'text-amber-500', barBg: 'bg-amber-50' },
    family: { label: '가정 및 육아 / 가족관계', icon: <Home className="w-4 h-4 text-indigo-500" />, color: 'bg-indigo-500', text: 'text-indigo-500', barBg: 'bg-indigo-50' },
    healthSelf: { label: '자아성찰 및 심신건강 / 우울', icon: <User className="w-4 h-4 text-emerald-500" />, color: 'bg-emerald-500', text: 'text-emerald-500', barBg: 'bg-emerald-50' },
    financeFuture: { label: '경제여건 및 물질적 불안', icon: <TrendingUp className="w-4 h-4 text-purple-500" />, color: 'bg-purple-500', text: 'text-purple-500', barBg: 'bg-purple-50' },
    others: { label: '기타 일상 자잘한 고민들', icon: <Activity className="w-4 h-4 text-slate-500" />, color: 'bg-slate-500', text: 'text-slate-500', barBg: 'bg-slate-50' },
  };

  const activeAnalysis = analysis || {
    categoryCounts: { relationship: 15, workAcademic: 20, family: 15, healthSelf: 20, financeFuture: 15, others: 15 },
    primaryStressCategory: "데이터 대기 중",
    stressScore: 30,
    analysisDescription: "아직 상담 대화 기록이 없거나 분석을 진행하지 않았습니다. 다온과 몽이 등 따뜻한 AI 상담원들과 깊은 담소를 2회 나누고, 감정 일지를 1회 적은 뒤 아래 버튼을 클릭하여 실시간 스트레스 테마 분류 및 종합 보고서를 발급해 보세요.",
    actionPlan: [
      "AI 동반자와 대화 2회 나누며 속 터놓기",
      "감정 모듈을 활용하여 마음 일지 1회 작성해 보기",
      "호흡 가이드 탭에서 긴장된 신경 가라앉히기"
    ],
    tailoredCounselingGuide: "상담 분위기 자율 조율을 대기 중입니다. 분석을 완료하면 상담가들이 더 깊은 정보와 배려를 안고 사용자를 영접하게 됩니다.",
    updatedAt: ""
  };

  return (
    <div id="stress_analysis_root" className="w-full flex flex-col space-y-6">
      
      {/* Intro Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-50/50 via-rose-50/20 to-white dark:from-slate-900/40 dark:to-slate-900/10 p-5 rounded-2xl border border-indigo-100/50 dark:border-indigo-950/20">
        <div className="flex items-start gap-3.5">
          <div className="p-3 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-xl border border-indigo-200/20 text-indigo-600 dark:text-indigo-400">
            <Brain className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                마음 스트레스 정밀 진단 & 테마 분류
              </h2>
              <span className="text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                AI 자율 학습 상담소
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
              사용자님이 나눈 <strong>상담 대화 데이터</strong>와 <strong>일기(Diary) 기록</strong>의 맥락을 분석하여 가장 지배적인 스트레스 카테고리를 추적합니다. 이 분석이 실행되면 마음 상담원들의 대화 시스템이 해당 취약 고민 부면을 보듬도록 정밀하게 <strong>자동 업그레이드</strong>됩니다.
            </p>
          </div>
        </div>

        <button
          onClick={runAnalysis}
          disabled={isRunning}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-slate-800 dark:bg-slate-100 hover:bg-slate-700 dark:hover:bg-white text-white dark:text-slate-900 font-bold rounded-xl text-sm transition-all shadow-sm disabled:opacity-55 cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
          {activeAnalysis.primaryStressCategory === "데이터 대기 중" ? '정밀 심리 진단 시작' : 'AI 실시간 마음 분석 업데이트'}
        </button>
      </div>

      {isRunning ? (
        /* Dynamic Thinking Spinner Screens */
        <div className="py-16 flex flex-col items-center justify-center text-center space-y-6 bg-slate-50/50 dark:bg-slate-900/30 rounded-3xl border border-slate-100 dark:border-slate-800/80">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-24 h-24 rounded-full border-4 border-indigo-500/10 border-t-indigo-500 animate-spin" />
            <div className="absolute w-16 h-16 rounded-full border-4 border-rose-500/15 border-b-rose-400 animate-spin-reverse" />
            <Brain className="w-8 h-8 text-indigo-500 animate-pulse" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">
              {progressTexts[progressIdx]}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              세상의 모든 걱정을 내려놓고 잠시 숨을 고르고 계세요. 마음을 꼼꼼하게 들여다보고 있답니다.
            </p>
          </div>

          {/* Staggered mini visual indicators */}
          <div className="flex gap-2.5">
            {progressTexts.map((_, i) => (
              <span 
                key={i} 
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  i === progressIdx 
                    ? 'bg-indigo-500 scale-125' 
                    : i < progressIdx 
                      ? 'bg-indigo-400 opacity-60' 
                      : 'bg-slate-200 dark:bg-slate-800'
                }`} 
              />
            ))}
          </div>
        </div>
      ) : (
        /* Real Dashboard Display */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Column - clinical reviews & actions (7/12) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Stress analysis details letter card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-850 p-5 sm:p-6 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/40 dark:bg-indigo-950/10 rounded-full blur-2xl -z-1" />
              
              <div className="flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-850 pb-3">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-slate-800 dark:text-slate-100">
                  AI 종합 정서 분석 소견서
                </h3>
              </div>

              <div className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap select-text">
                {activeAnalysis.analysisDescription}
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                  본 명세서는 일주일 동안의 감정지표 수치를 종합 수렴한 실시간 마음 검진표입니다.
                </span>
                {activeAnalysis.updatedAt && (
                  <span>성공 일시: {new Date(activeAnalysis.updatedAt).toLocaleDateString()}</span>
                )}
              </div>
            </div>

            {/* Daily wellness prescription checklist */}
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-slate-800 dark:text-slate-100">
                  오늘 시도해 볼 마음-케어 3가지 실천 행동 처방
                </h3>
              </div>

              <div className="space-y-3">
                {activeAnalysis.actionPlan.map((action, idx) => {
                  const isDone = !!completedActions[idx];
                  return (
                    <motion.div 
                      key={idx}
                      whileHover={{ x: 2 }}
                      onClick={() => handleToggleAction(idx)}
                      className={`flex items-start gap-4 p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isDone 
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-200/50 dark:border-emerald-850/30 text-slate-400 dark:text-slate-500' 
                          : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-850 text-slate-700 dark:text-slate-300 hover:shadow-xs'
                      }`}
                    >
                      <button className="shrink-0 mt-0.5" title="체크">
                        {isDone ? (
                          <CheckSquare className="w-5 h-5 text-emerald-500 fill-emerald-50 dark:fill-emerald-950" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-300 dark:text-slate-600 hover:text-indigo-400" />
                        )}
                      </button>
                      <span className={`text-sm ${isDone ? 'line-through decoration-1 text-slate-400 dark:text-slate-500' : 'font-medium'}`}>
                        {action}
                      </span>
                    </motion.div>
                  );
                })}
              </div>

              {Object.values(completedActions).filter(Boolean).length === 3 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-4 p-3.5 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl border border-emerald-200/20 text-center text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                >
                  🎉 대단합니다! 오늘의 조그만 실천이 더 큰 마음 평화를 선물해 줄 거예요. 잘 해내셨어요!
                </motion.div>
              )}
            </div>

          </div>

          {/* Right Column - visual bars & gauge (5/12) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Graphical visual widget: Stress Index Gauge */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-850 p-5 shadow-xs flex flex-col items-center text-center">
              <h3 className="font-bold text-sm text-slate-400 uppercase tracking-widest mb-4">
                종합 마음 스트레스 유독 지수
              </h3>
              
              <div className="relative w-44 h-44 flex items-center justify-center">
                {/* Custom SVG semicircle gauge */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="88"
                    cy="88"
                    r="72"
                    strokeWidth="11"
                    stroke="currentColor"
                    className="text-slate-100 dark:text-slate-800"
                    fill="transparent"
                  />
                  <circle
                    cx="88"
                    cy="88"
                    r="72"
                    strokeWidth="11"
                    strokeDasharray={2 * Math.PI * 72}
                    strokeDashoffset={2 * Math.PI * 72 * (1 - activeAnalysis.stressScore / 100)}
                    strokeLinecap="round"
                    stroke="currentColor"
                    className={`transition-all duration-1000 ${
                      activeAnalysis.stressScore < 40 
                        ? 'text-emerald-400 dark:text-emerald-500' 
                        : activeAnalysis.stressScore < 75 
                          ? 'text-amber-400 dark:text-amber-500' 
                          : 'text-rose-500'
                    }`}
                    fill="transparent"
                  />
                </svg>
                
                <div className="absolute text-center">
                  <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                    {activeAnalysis.stressScore}
                  </span>
                  <span className="text-slate-400 dark:text-slate-500 font-bold ml-0.5">/100</span>
                  <div className={`text-xs font-bold px-2 py-0.5 rounded-full mt-1.5 ${
                    activeAnalysis.stressScore < 40 
                      ? 'bg-emerald-50 dark:bg-emerald-950/35 text-emerald-600 dark:text-emerald-400' 
                      : activeAnalysis.stressScore < 75 
                        ? 'bg-amber-50 dark:bg-amber-950/35 text-amber-600 dark:text-amber-400' 
                        : 'bg-rose-50 dark:bg-rose-950/35 text-rose-600 dark:text-rose-400'
                  }`}>
                    {activeAnalysis.stressScore < 40 ? '안정적 심리' : activeAnalysis.stressScore < 75 ? '누적된 긴장' : '집중 돌봄 필요'}
                  </div>
                </div>
              </div>

              {activeAnalysis.primaryStressCategory !== "데이터 대기 중" && (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-850 w-full">
                  <span className="text-xs text-slate-400 block">가장 취약한 핵심 스트레스 유발처</span>
                  <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 block mt-1">
                    {activeAnalysis.primaryStressCategory} 스트레스
                  </span>
                </div>
              )}
            </div>

            {/* Theme Classification List */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-850 p-5 shadow-xs">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-indigo-500" />
                분야별 정서 영향 지수 지형도
              </h3>

              <div className="space-y-4">
                {Object.entries(activeAnalysis.categoryCounts).map(([cat, val]) => {
                  const details = themeConfig[cat as keyof typeof themeConfig] || themeConfig.others;
                  return (
                    <div key={cat} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold">
                          {details.icon}
                          {details.label}
                        </span>
                        <span className={`font-extrabold ${details.text}`}>{val}점</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(val, 5)}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className={`h-full ${details.color} rounded-full`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Counselor auto tuning notice banner */}
      {activeAnalysis.primaryStressCategory !== "데이터 대기 중" && !isRunning && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-indigo-50/50 dark:bg-slate-900/40 border border-indigo-100/50 dark:border-slate-800 rounded-2xl flex items-start sm:items-center gap-3.5"
        >
          <div className="text-2xl select-none hidden sm:block">🧬</div>
          <div className="flex-1">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 block uppercase tracking-wide">
              상담 프로그램 AI 기계 연동 업그레이드 활성화 중
            </span>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              최근에 도출된 <strong>[{activeAnalysis.primaryStressCategory}]</strong>에 최적화된 처방전과 다정한 임상 조언 가이드가 AI 대화 연계 시스템에 주입되었습니다. 다온, 뮤아, 은율, 몽이 중 마음에 드는 상담 파트너를 선택해 대화해 보세요. 더욱 성숙하고 당신을 정확히 이해하는 밀착 위로를 선물해 드립니다.
            </p>
          </div>
        </motion.div>
      )}

      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 p-4 rounded-xl flex items-start gap-3.5 text-rose-700 dark:text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
          <div>
            <span className="font-extrabold block">분석 작업 진행 유예</span>
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{error}</p>
          </div>
        </div>
      )}

    </div>
  );
}
