
export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
}

export interface ChatMessage {
  id: number;
  role: MessageRole;
  text: string;
}

export interface Monster {
    name: string;
    description: string;
    score: number;
    currentHP: number;
    imageUrl: string;
}

export interface StressAnalysis {
    stressScore: number;
    monsterName: string;
    monsterDescription: string;
}

export interface StressRecord {
  date: string; // ISO string
  score: number;
}

export interface SleepRecord {
  date: string; // ISO string for the wake-up day
  bedTime: string; // "HH:mm"
  wakeTime: string; // "HH:mm"
  duration: number; // in hours
}

export interface DiaryAchievement {
    predefined: Record<string, boolean>;
    custom: { id: number; text: string }[];
}

export interface DiaryEntry {
    date: string; // YYYY-MM-DD
    plan: string;
    achievements: DiaryAchievement;
    score: number;
}

export interface ToDoItem {
  id: number;
  title: string;
  dueDate: string | null; // YYYY-MM-DD
  startTime: string | null; // HH:mm
  endTime: string | null; // HH:mm
  memo: string;
  isCompleted: boolean;
  isFavorite: boolean;
  order: number;
}

export type AppState = 'HOME' | 'CHAT' | 'MONSTER_REVEAL' | 'ATTACK_RESULT';

// --- New Types for Weather and Mood ---

export interface LocationPreference {
  method: 'auto' | 'manual';
  lat?: number;
  lon?: number;
  zip?: string; // 郵便番号 (手動設定用)
  name?: string; // 表示用名称（任意）
}

// サーバーからのレスポンス仕様に合わせた定義
export interface WeatherData {
  condition: string; //'sun' | 'cloud' | 'rain' | 'snow';
  temp_c: number;
  message: string;
  updated_at: string; 
  place?: string; //ttl_seconds: number;
}

export interface MoodRecord {
  date: string; // YYYY-MM-DD
  score: number; // -3 to 3
  emoji: string;
}
