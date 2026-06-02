/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CounselorId = 'daon' | 'mua' | 'eunyul' | 'mongi';

export interface Counselor {
  id: CounselorId;
  name: string;
  title: string;
  avatar: string; // Emoji or short key
  bgColor: string; // Tailwind bg class
  borderColor: string; // Tailwind border class
  accentColor: string; // Tailwind text/bg accent class
  description: string;
  greeting: string;
  systemPrompt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  createdAt: string;
}

export type MoodType = 'exhausted' | 'sad' | 'neutral' | 'angry' | 'lonely' | 'happy' | 'anxious';

export interface MoodConfig {
  type: MoodType;
  label: string;
  emoji: string;
  color: string; // Tailwind text/bg class
  comfortQuote: string;
}

export interface DiaryEntry {
  id: string;
  date: string; // YYYY-MM-DD
  mood: MoodType;
  intensity: number; // 1 to 5
  note: string;
  createdAt: string;
}

export interface LetterOfComfort {
  id: string;
  worryText: string;
  responseLetter: string | null;
  createdAt: string;
  colorTheme: 'ocean' | 'sunset' | 'forest' | 'starlight';
}
