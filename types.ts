
export type LanguageCode = 'en' | 'de' | 'ja' | 'zh' | 'pt' | 'es' | 'ar' | 'tr' | 'ru' | 'fr';

export type ViewMode = 'PAGE' | 'RSVP';

export interface Chapter {
  title: string;
  startIndex: number;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  content: string[]; // Array of words
  chapters?: Chapter[];
  coverColor: string;
  progress: number; // Current word index
  totalWords: number;
  addedAt: number;
  type: 'epub' | 'txt' | 'paste' | 'pdf' | 'lesson' | 'gutenberg';
}

export interface UserStats {
  xp: number;
  level: number;
  totalWordsRead: number;
  totalTimeMinutes: number;
  currentWpm: number;
  streakDays: number;
  lastReadDate: string | null;
}

export interface ReadingSettings {
  wpm: number;
  chunkSize: number;
  fontSize: number;
  language: LanguageCode;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  content: string;
  defaultWpm: number;
}

export interface GutenbergBook {
  id: number;
  title: string;
  authors: { name: string }[];
  languages: string[];
  formats: Record<string, string>;
  download_count: number;
}

export enum ScreenState {
  SPLASH = 'SPLASH',
  HOME = 'HOME',
  LIBRARY = 'LIBRARY',
  READER = 'READER',
  TRAINING = 'TRAINING',
  STATS = 'STATS'
}
