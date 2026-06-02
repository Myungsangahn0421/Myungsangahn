/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PlusCircle, Calendar, Trash2, Heart, Award, ArrowUpRight, ShieldCheck, Sparkles } from 'lucide-react';
import { MOODS } from '../data/moods';
import { DiaryEntry, MoodType } from '../types';

// Helper to format writing time of diary logs
const formatDiaryTime = (createdAtStr: string) => {
  try {
    const d = new Date(createdAtStr);
    const ampm = d.getHours() >= 12 ? '오후' : '오전';
    let hours = d.getHours() % 12;
    hours = hours ? hours : 12;
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${ampm} ${hours}:${minutes}`;
  } catch (e) {
    return '';
  }
};

export default function MoodDiary() {
  const [diaries, setDiaries] = useState<DiaryEntry[]>([]);

  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedMood, setSelectedMood] = useState<MoodType>('neutral');
  const [intensity, setIntensity] = useState(3);
  const [note, setNote] = useState('');
  const [isSuccessFeedback, setIsSuccessFeedback] = useState(false);

  // Load diaries from server persistent DB on mount
  useEffect(() => {
    let isMounted = true;
    fetch('/api/counsel/data')
      .then(res => res.json())
      .then(data => {
        if (isMounted && data && Array.isArray(data.diaries)) {
          setDiaries(data.diaries);
        }
      })
      .catch(err => console.error('Failed to load diaries from server database:', err));
    return () => { isMounted = false; };
  }, []);

  // Sync to local storage for quick offline/resilience fallback
  useEffect(() => {
    try {
      localStorage.setItem('mind_center_diaries', JSON.stringify(diaries));
    } catch (err) {
      console.error('Failed to persist diaries to local storage:', err);
    }
  }, [diaries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;

    try {
      const response = await fetch('/api/counsel/diaries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date,
          mood: selectedMood,
          intensity,
          note
        })
      });

      if (!response.ok) {
        throw new Error('일지 저장에 실패했습니다.');
      }

      const newEntry = await response.json();
      setDiaries(prev => [newEntry, ...prev]);
      setNote('');
      setIntensity(3);
      setSelectedMood('neutral');
      setIsSuccessFeedback(true);
      
      setTimeout(() => {
        setIsSuccessFeedback(false);
      }, 2800);
    } catch (err: any) {
      console.error(err);
      alert(err.message || '마음 일지 저장 중 서버 오류가 있어 지연되었습니다.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('이 감정 일지 기록을 완전히 삭제할까요?')) {
      try {
        const response = await fetch(`/api/counsel/diaries/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          setDiaries(prev => prev.filter(d => d.id !== id));
        } else {
          throw new Error('서버에서 일지를 삭제하지 못했습니다.');
        }
      } catch (err: any) {
        console.error(err);
        alert(err.message || '삭제 진행 중 네트워크 흐름에 차질이 생겼습니다.');
      }
    }
  };

  // Get mood statistics for visualization
  const getMoodStats = () => {
    if (diaries.length === 0) return null;
    const totals: Record<MoodType, number> = {} as any;
    diaries.forEach(d => {
      totals[d.mood] = (totals[d.mood] || 0) + 1;
    });
    
    // Find dominant mood
    let dominant: MoodType = 'neutral';
    let max = 0;
    (Object.keys(totals) as MoodType[]).forEach(k => {
      if (totals[k] > max) {
        max = totals[k];
        dominant = k;
      }
    });

    const dominantConfig = MOODS.find(m => m.type === dominant);
    return {
      totalLogs: diaries.length,
      dominant: dominantConfig,
      avgIntensity: (diaries.reduce((sum, d) => sum + d.intensity, 0) / diaries.length).toFixed(1)
    };
  };

  const stats = getMoodStats();

  return (
    <div id="mood_diary_root" className="w-full flex flex-col lg:flex-row gap-6 p-1">
      
      {/* Form Section */}
      <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/80">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 mb-2">
          <Heart className="w-5 h-5 text-rose-500 fill-rose-500" /> 오늘 마음 기록하기
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
          지금 스치는 미세한 마음에 이름과 깊이를 붙여주는 것만으로도 마음 정리에 큰 도움이 됩니다.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> 날짜 선택
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Mood Icons Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              지금 감정 감지
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {MOODS.map((mood) => {
                const isActive = mood.type === selectedMood;
                return (
                  <button
                    type="button"
                    key={mood.type}
                    onClick={() => setSelectedMood(mood.type)}
                    className={`flex flex-col items-center justify-center py-2.5 rounded-xl border transition-all cursor-pointer ${
                      isActive
                        ? mood.color + ' border-current scale-105 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-white hover:bg-slate-50 dark:bg-slate-900'
                    }`}
                  >
                    <span className="text-2xl mb-1">{mood.emoji}</span>
                    <span className="text-[10px] font-semibold tracking-tight">{mood.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Emotional Intensity scale */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                감정의 세기 / 깊이
              </label>
              <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-sm">
                LV. {intensity} (1~5)
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-800 dark:accent-slate-200"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 px-1">
              <span>미약함 (1)</span>
              <span>보통 (3)</span>
              <span>강하게 차오름 (5)</span>
            </div>
          </div>

          {/* Note Area */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              무슨 일이 있으셨나요?
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="일기 쓰듯 솔직하게 적어보세요. 누구의 잣대도 들어갈 수 없는 당신만의 정밀한 대나무숲이자 안전한 일지관입니다."
              maxLength={500}
              className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400 focus:bg-white dark:focus:bg-slate-950 text-slate-800 dark:text-slate-100 resize-none leading-relaxed"
            />
          </div>

          <button
            type="submit"
            disabled={!note.trim()}
            className="w-full py-2.5 bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-medium rounded-xl hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors text-sm cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" /> 마음 일지 저장하기
          </button>
        </form>

        <AnimatePresence>
          {isSuccessFeedback && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-950/40 text-xs text-center flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> 오늘 마음 일지가 안전하게 기록되었습니다.
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* History logs / Analytics sidebar panel */}
      <div className="flex-1 bg-slate-50 dark:bg-slate-950/20 rounded-2xl p-5 border border-slate-200/40 dark:border-slate-800/20 flex flex-col min-h-[460px]">
        {/* Heart Log Stats */}
        <div className="mb-5 pb-5 border-b border-slate-200/50 dark:border-slate-800/40">
          <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-3 flex items-center gap-1">
            <Award className="w-3.5 h-3.5" /> 나의 감정 패턴
          </h4>

          {stats ? (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 p-3 rounded-xl flex flex-col justify-center">
                <span className="text-[10px] text-slate-400 block">총 일지수</span>
                <span className="text-lg font-bold font-mono text-slate-800 dark:text-slate-100 mt-1">
                  {stats.totalLogs} <span className="text-xs font-normal">회</span>
                </span>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 p-3 rounded-xl flex flex-col items-center justify-center">
                <span className="text-[10px] text-slate-400 block text-center w-full">가장 많이 느낀</span>
                <div className="flex items-center gap-1 mt-1 text-slate-800 dark:text-slate-100">
                  <span className="text-lg">{stats.dominant?.emoji}</span>
                  <span className="text-xs font-bold leading-none">{stats.dominant?.label}</span>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 p-3 rounded-xl flex flex-col justify-center">
                <span className="text-[10px] text-slate-400 block">일간 평균 강도</span>
                <span className="text-lg font-bold font-mono text-slate-800 dark:text-slate-100 mt-1">
                  {stats.avgIntensity} <span className="text-[10px] font-normal text-slate-400">/ 5</span>
                </span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 bg-white/50 dark:bg-slate-950/20 p-4 rounded-xl text-center leading-normal">
              최소 하나의 일지가 작성되면 감정 도표 및 통계 요약이 자동으로 계산됩니다.
            </div>
          )}
        </div>

        {/* History Scroll window */}
        <div className="flex-1 flex flex-col h-1">
          <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-3">
            지나온 감정 일지 목록
          </h4>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            <AnimatePresence initial={false}>
              {diaries.length === 0 ? (
                <div className="text-center py-12 px-4 text-xs text-slate-400 leading-snug">
                  🍃 아직 슬퍼하거나 지쳤던 감정 일지가 없습니다.<br/>
                  첫 번째 마음 노트를 가득 채워 마음에 산들바람을 전하세요.
                </div>
              ) : (
                diaries.map((diary) => {
                  const moodConfig = MOODS.find(m => m.type === diary.mood) || MOODS[5];
                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={diary.id}
                      className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col relative group"
                    >
                      {/* Delete button (hoverable) */}
                      <button
                        onClick={() => handleDelete(diary.id)}
                        className="absolute top-3 right-3 text-slate-300 hover:text-rose-500 p-1 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                        title="일지 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Header row */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xs font-mono text-slate-400 bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-200/40 dark:border-slate-800/40 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {diary.date} {diary.createdAt && `(${formatDiaryTime(diary.createdAt)})`}
                        </span>
                        
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border ${moodConfig.color}`}>
                          <span>{moodConfig.emoji}</span> {moodConfig.label}
                        </span>

                        <span className="text-[10px] text-slate-400">
                          (강도 {diary.intensity})
                        </span>
                      </div>

                      {/* Journal Text */}
                      <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap break-all pr-5">
                        {diary.note}
                      </p>

                      {/* Quick comfort reminder section */}
                      <div className="mt-3.5 pt-3 border-t border-dashed border-slate-100 dark:border-slate-800/80 text-[11px] text-indigo-600 dark:text-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/10 p-2.5 rounded-lg">
                        <p className="leading-relaxed flex items-start gap-1">
                          <span className="text-xs shrink-0 font-bold"><Sparkles className="w-3.5 h-3.5 inline text-indigo-500" /> AI 조언:</span> 
                          <span>"{moodConfig.comfortQuote}"</span>
                        </p>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>

    </div>
  );
}
