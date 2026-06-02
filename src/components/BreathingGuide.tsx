/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, Activity, Wind, Info } from 'lucide-react';

type BreathPhase = 'idle' | 'inhale' | 'hold' | 'exhale';

export default function BreathingGuide() {
  const [phase, setPhase] = useState<BreathPhase>('idle');
  const [secondsLeft, setSecondsLeft] = useState(4);
  const [cycleCount, setCycleCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning) {
      if (phase === 'idle') {
        // Start cycle
        setPhase('inhale');
        setSecondsLeft(4);
      }

      interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            // Phase transition
            if (phase === 'inhale') {
              setPhase('hold');
              return 4;
            } else if (phase === 'hold') {
              setPhase('exhale');
              return 4;
            } else if (phase === 'exhale') {
              setPhase('inhale');
              setCycleCount((c) => c + 1);
              return 4;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, phase]);

  const handleStartStop = () => {
    if (!isRunning) {
      setIsRunning(true);
      setPhase('inhale');
      setSecondsLeft(4);
    } else {
      setIsRunning(false);
      setPhase('idle');
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setPhase('idle');
    setSecondsLeft(4);
    setCycleCount(0);
  };

  const getPhaseText = () => {
    switch (phase) {
      case 'inhale':
        return '가만히 숨을 들이마셔 보세요 (Inhale)';
      case 'hold':
        return '숨을 멈추고 온기를 밀어두세요 (Hold)';
      case 'exhale':
        return '천천히 한숨을 밖으로 비워내세요 (Exhale)';
      default:
        return '차분히 호흡 치료를 시작할 준비를 해보세요';
    }
  };

  const getPhaseColor = () => {
    switch (phase) {
      case 'inhale':
        return 'text-emerald-500 dark:text-emerald-400';
      case 'hold':
        return 'text-amber-500 dark:text-amber-400';
      case 'exhale':
        return 'text-indigo-500 dark:text-indigo-400';
      default:
        return 'text-slate-500';
    }
  };

  const getCircleScale = () => {
    if (phase === 'inhale') return 1.5;
    if (phase === 'hold') return 1.5;
    if (phase === 'exhale') return 1.0;
    return 1.1;
  };

  const getCircleDuration = () => {
    if (phase === 'inhale' || phase === 'exhale') return 4;
    return 0.5; // Quick hold bounce
  };

  return (
    <div id="breathing_guide_root" className="w-full flex flex-col md:flex-row items-center justify-between gap-8 p-4 sm:p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-100 dark:border-slate-800/80">
      
      {/* Interactive Visualizer Sphere */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200/40 dark:border-slate-800/20 w-full min-h-[300px]">
        <div className="relative flex items-center justify-center h-52 w-52 select-none">
          {/* Breathing expanding aura indicator */}
          <motion.div
            animate={{
              scale: getCircleScale(),
              opacity: phase === 'idle' ? 0.2 : [0.3, 0.45, 0.3],
            }}
            transition={{
              scale: { duration: getCircleDuration(), ease: 'easeInOut' },
              opacity: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
            }}
            className="absolute rounded-full h-32 w-32 bg-emerald-500/10 blur-xl"
          />

          {/* Core circle */}
          <motion.div
            animate={{
              scale: getCircleScale(),
            }}
            transition={{
              duration: getCircleDuration(),
              ease: 'easeInOut',
            }}
            className={`h-24 w-24 rounded-full border-4 flex items-center justify-center relative shadow-md ${
              phase === 'inhale'
                ? 'border-emerald-400 bg-emerald-500/20'
                : phase === 'hold'
                ? 'border-amber-400 bg-amber-500/20'
                : phase === 'exhale'
                ? 'border-indigo-400 bg-indigo-500/20'
                : 'border-slate-300 bg-slate-100 dark:bg-slate-800/50 dark:border-slate-700'
            }`}
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={secondsLeft + '-' + phase}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.2 }}
                transition={{ duration: 0.15 }}
                className="text-2xl font-bold font-mono text-slate-800 dark:text-slate-100"
              >
                {phase === 'idle' ? '•' : secondsLeft}
              </motion.span>
            </AnimatePresence>
            
            {phase !== 'idle' && (
              <span className="absolute -bottom-6 text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-bold">
                {phase}
              </span>
            )}
          </motion.div>
        </div>

        {/* Dynamic instruction texts */}
        <div className="text-center mt-6">
          <p className={`text-base font-semibold transition-colors duration-300 leading-normal ${getPhaseColor()}`}>
            {getPhaseText()}
          </p>
          <div className="mt-2 flex items-center justify-center gap-4 text-xs font-mono text-slate-400 dark:text-slate-500">
            <span className="flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" /> 총 호흡 수 {cycleCount}회
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Wind className="w-3.5 h-3.5" /> 4-4-4 리듬
            </span>
          </div>
        </div>

        {/* Buttons Controls */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleStartStop}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${
              isRunning
                ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/10'
                : 'bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4" /> 일시정지
              </>
            ) : (
              <>
                <Play className="w-4 h-4" /> 마음호흡 시작
              </>
            )}
          </button>
          
          <button
            onClick={handleReset}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60 rounded-xl transition-colors cursor-pointer"
            title="초기화"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Structured Text Guide panel */}
      <div className="flex-1 max-w-sm flex flex-col justify-center space-y-4">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
          <Wind className="w-5 h-5 text-emerald-500" /> 호흡 치료 안내
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          마음이 몹시 지치거나 울컥할 때, 얕아진 호흡을 아래의 고른 규칙에 따라 다스려보세요. 뇌에 안정적인 산소를 공급해 감정적 긴장을 누그러뜨려 줍니다.
        </p>

        <div className="space-y-3 bg-slate-50/50 dark:bg-slate-950/10 p-4 rounded-xl border border-slate-100 dark:border-slate-800/40">
          <div className="flex items-start gap-2.5 text-xs">
            <span className="h-5 w-5 rounded-full flex items-center justify-center bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold shrink-0">1</span>
            <div>
              <p className="font-bold text-slate-700 dark:text-slate-300">4초간 숨 고르기 (흡기)</p>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">안정적이고 온화한 기분을 복부 하단부터 가득 들이마십니다.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-2.5 text-xs">
            <span className="h-5 w-5 rounded-full flex items-center justify-center bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 font-bold shrink-0">2</span>
            <div>
              <p className="font-bold text-slate-700 dark:text-slate-300">4초간 숨 머금기 (지식)</p>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">체내에 가둬진 공기의 순수한 고요함과 체온을 차분히 느껴봅니다.</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 text-xs">
            <span className="h-5 w-5 rounded-full flex items-center justify-center bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 font-bold shrink-0">3</span>
            <div>
              <p className="font-bold text-slate-700 dark:text-slate-300">4초간 숨 내뱉기 (호기)</p>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">어깨의 무게감, 미움과 피조감을 남김없이 바람과 함께 날려 보냅니다.</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 p-3 bg-indigo-50/40 dark:bg-indigo-950/10 rounded-xl text-[11px] text-indigo-700 dark:text-indigo-300 border border-indigo-100/30 dark:border-indigo-900/20">
          <Info className="w-4 h-4 shrink-0 text-indigo-500 mt-0.5" />
          <p className="leading-snug">수십 번을 거듭할 필요 없이 단 3-5번의 올바른 순환 호흡만으로도 부교감신경계를 일깨우는 훌륭한 치유가 이뤄집니다.</p>
        </div>
      </div>

    </div>
  );
}
