/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MoodConfig } from '../types';

export const MOODS: MoodConfig[] = [
  {
    type: 'exhausted',
    label: '완전 지침',
    emoji: '😫',
    color: 'text-amber-600 bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800/40',
    comfortQuote: '숨이 차오를 때는 그냥 모든 것을 내려놓고 깊은 숨을 내쉬어 보세요. 지친다는 건 그만큼 열심히 살아냈다는 훈장입니다.'
  },
  {
    type: 'sad',
    label: '쓸쓸/슬픔',
    emoji: '💧',
    color: 'text-blue-600 bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800/40',
    comfortQuote: '우는 건 마음을 청소하는 가장 순수한 물송이입니다. 억지로 활짝 웃을 필요 없어요. 슬픈 마음이 온전히 흐르게 비워두셔요.'
  },
  {
    type: 'anxious',
    label: '불안/초조',
    emoji: '🥺',
    color: 'text-purple-600 bg-purple-100 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200 dark:border-purple-800/40',
    comfortQuote: '일어나지 않을 내일의 허상을 안고 오늘을 힘겹게 만들지 마세요. 지금 마시는 한 모금의 숨만이 유일한 진실입니다.'
  },
  {
    type: 'angry',
    label: '울컥/화남',
    emoji: '🔥',
    color: 'text-rose-600 bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800/40',
    comfortQuote: '끓어오르는 불꽃 또한 당신이 상처받지 않으려 스스로를 지탱하는 방어선입니다. 노여움을 부드럽게 안아 소화시켜 줄게요.'
  },
  {
    type: 'lonely',
    label: '외로움',
    emoji: '🌌',
    color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/40',
    comfortQuote: '우리가 넓은 우주에서 한 줄기 고독을 느낄 때, 비로소 내면의 조용한 보석과 마주합니다. 제가 이 고요한 밤의 동반자가 될게요.'
  },
  {
    type: 'neutral',
    label: '덤덤함',
    emoji: '🍃',
    color: 'text-zinc-600 bg-zinc-100 dark:bg-zinc-950/40 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800/40',
    comfortQuote: '덤덤한 하루는 일상의 평온이자 마음의 고른 휴식 상태입니다. 평온하게 바람에 흩날리는 나뭇잎처럼 한 걸음 걸어보세요.'
  },
  {
    type: 'happy',
    label: '홀가분함',
    emoji: '☀️',
    color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40',
    comfortQuote: '찰나의 기쁨과 아늑함에 온전히 미소 지어 보세요. 이 반짝이는 기억들이 소담하게 차곡차곡 쌓여 당신을 영영 지켜줄 겁니다.'
  }
];
