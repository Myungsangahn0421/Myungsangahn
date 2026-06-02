/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Compass, Wind, Sparkles, MessageSquareHeart, Sun, Moon, MapPinOff, BookHeart, Brain } from 'lucide-react';
import CounselorChat from './components/CounselorChat';
import MoodDiary from './components/MoodDiary';
import BreathingGuide from './components/BreathingGuide';
import LetterSea from './components/LetterSea';
import StressAnalysis from './components/StressAnalysis';

type ActiveTab = 'chat' | 'diary' | 'breathing' | 'sea' | 'analysis';

const HEART_QUOTES = [
  "괜찮지 않아도 대단히 괜찮습니다. 아픈 감정 또한 당신을 지키려는 내면의 정직한 외침이니까요.",
  "바람이 거세게 분다고 꽃이 피기를 주저하지 않듯, 오늘의 시련 또한 당신의 내면 속 씨앗을 키우는 단잠과 같습니다.",
  "자책하지 말아주세요. 당신은 이미 존재 그 자체만으로도 오늘 누군가에게 더없이 훌륭한 온기였습니다.",
  "한 걸음 뒤로 물러서 보세요. 밤하늘 모든 별들은 어둠이 가장 깊을 때 비로소 제 빛을 세상에 뿌리기 시작합니다.",
  "아무것도 해내지 못한 날이라 생각해도, 오늘 하루 무사히 살아 숨 쉬어 준 것만으로도 충분히 기적 같은 일입니다.",
  "어려운 시기는 영영 가두어진 동굴이 아니라, 새로운 빛을 맞이하기 위해 터널처럼 고이 뚫린 통로입니다."
];

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [quote, setQuote] = useState('');
  const [darkTheme, setDarkTheme] = useState(false);

  useEffect(() => {
    // Select daily random uplifting comfort quote
    const randIdx = Math.floor(Math.random() * HEART_QUOTES.length);
    setQuote(HEART_QUOTES[randIdx]);
  }, []);

  useEffect(() => {
    if (darkTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkTheme]);

  return (
    <div id="mind_app_wrapper" className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-300">
      
      {/* Decorative Warm Top Aura Design */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-64 bg-radial-gradient from-rose-400/5 via-indigo-400/5 to-transparent pointer-events-none blur-3xl" />

      {/* Primary Container Layout */}
      <div className="w-full max-w-6xl mx-auto px-4 py-6 sm:py-8 relative z-10 flex flex-col min-h-screen">
        
        {/* Header Branding Row */}
        <header className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 pb-5 border-b border-slate-200/50 dark:border-slate-800/45">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100 flex items-center justify-center sm:justify-start gap-2 select-none">
              <span className="text-rose-500 fill-rose-500 animate-pulse">❤️</span> 마음 상담소
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              지친 발걸음을 멈추고 잠시 앉아, 따뜻한 마음의 이야기를 담소 나누다 가세요.
            </p>
          </div>

          {/* Theme Shift & Header Utilities */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDarkTheme(!darkTheme)}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-200/40 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
              title={darkTheme ? "따스한 햇살 모드" : "아늑한 밤하늘 모드"}
            >
              {darkTheme ? <Sun className="w-4.5 h-4.5 text-amber-400 animate-spin-slow" /> : <Moon className="w-4.5 h-4.5" />}
            </button>
          </div>
        </header>

        {/* Dynamic quote of the day banner card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/80 shadow-xs mb-6 flex items-start gap-3 relative overflow-hidden group select-none">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 dark:bg-indigo-500/5 blur-xl group-hover:scale-125 transition-transform" />
          <div className="text-2xl shrink-0">✨</div>
          <div>
            <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-500 inline" /> 위로의 글귀 한 마디
            </h3>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 italic leading-relaxed">
              "{quote}"
            </p>
          </div>
        </div>

        {/* Elegant Dashboard Tab Selector Bar */}
        <div className="bg-slate-200/40 dark:bg-slate-900/50 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-850/30 flex gap-1 select-none overflow-x-auto scrollbar-none mb-6">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 min-w-[90px] py-3 rounded-xl font-bold text-xs sm:text-sm tracking-tight flex items-center justify-center gap-2 cursor-pointer transition-all ${
              activeTab === 'chat'
                ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-100/50 dark:border-slate-700/50'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <MessageSquareHeart className="w-4 h-4 text-rose-500" /> 마음 대화
          </button>

          <button
            onClick={() => setActiveTab('diary')}
            className={`flex-1 min-w-[90px] py-3 rounded-xl font-bold text-xs sm:text-sm tracking-tight flex items-center justify-center gap-2 cursor-pointer transition-all ${
              activeTab === 'diary'
                ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-100/50 dark:border-slate-700/50'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <BookHeart className="w-4 h-4 text-indigo-500" /> 감정 일지
          </button>

          <button
            onClick={() => setActiveTab('breathing')}
            className={`flex-1 min-w-[90px] py-3 rounded-xl font-bold text-xs sm:text-sm tracking-tight flex items-center justify-center gap-2 cursor-pointer transition-all ${
              activeTab === 'breathing'
                ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-100/50 dark:border-slate-700/50'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Wind className="w-4 h-4 text-emerald-500" /> 마음 호흡
          </button>

          <button
            onClick={() => setActiveTab('sea')}
            className={`flex-1 min-w-[90px] py-3 rounded-xl font-bold text-xs sm:text-sm tracking-tight flex items-center justify-center gap-2 cursor-pointer transition-all ${
              activeTab === 'sea'
                ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-100/50 dark:border-slate-700/50'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Compass className="w-4 h-4 text-teal-500" /> 편지 바다
          </button>

          <button
            onClick={() => setActiveTab('analysis')}
            className={`flex-1 min-w-[90px] py-3 rounded-xl font-bold text-xs sm:text-sm tracking-tight flex items-center justify-center gap-2 cursor-pointer transition-all ${
              activeTab === 'analysis'
                ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-100/50 dark:border-slate-700/50'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Brain className="w-4 h-4 text-indigo-500" /> 마음 분석
          </button>
        </div>

        {/* Target Component Window Container */}
        <main className="flex-1 w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl shadow-xs overflow-hidden mb-6 flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col p-4 sm:p-6"
            >
              {activeTab === 'chat' && <CounselorChat />}
              {activeTab === 'diary' && <MoodDiary />}
              {activeTab === 'breathing' && <BreathingGuide />}
              {activeTab === 'sea' && <LetterSea />}
              {activeTab === 'analysis' && <StressAnalysis />}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Peaceful Footer Acknowledgements */}
        <footer className="mt-auto text-center py-4 border-t border-slate-200/30 dark:border-slate-900 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 gap-3">
          <p>© 2026 마음 상담소. 늘 당신 편에서 지은이 없는 등대처럼 반짝이고 있습니다.</p>
          <div className="flex items-center gap-3">
            <span className="hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer transition-colors">따뜻한 방어선</span>
            <span>•</span>
            <span className="hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer transition-colors">자유 치유로</span>
          </div>
        </footer>

      </div>
    </div>
  );
}
