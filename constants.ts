
import { BookOpen, Brain, Library, TrendingUp } from 'lucide-react';
import { ReadingSettings } from './types';

export const THEME = {
  blue: '#2F7AE5',
  green: '#4CCD9A',
  yellow: '#E3C567',
  dark: '#0F1F2E',
  bgLight: '#F5F5F7',
  bgSoft: '#F1EFE8'
};

// 1 XP = 10 Words Read
// Level calculation is now non-linear to provide early gratification.
export const LEVELS = [
  { level: 1, xp: 0, title: 'Novice Reader', desc: 'Starting the journey. Learning to focus.' },
  { level: 2, xp: 100, title: 'Apprentice', desc: '1,000 words. Reducing subvocalization.' }, // ~4 pages
  { level: 3, xp: 500, title: 'Page Turner', desc: '5,000 words. Expanding visual span.' }, // ~1 Short Book
  { level: 4, xp: 2000, title: 'Bookworm', desc: '20,000 words. Consistent rhythm.' }, // ~1 Novel
  { level: 5, xp: 5000, title: 'Speed Reader', desc: '50,000 words. Mastering flow state.' }, 
  { level: 6, xp: 10000, title: 'Grandmaster', desc: '100,000+ words. Elite comprehension.' },
];

export const INITIAL_STATS = {
  xp: 0,
  level: 1,
  totalWordsRead: 0,
  totalTimeMinutes: 0,
  currentWpm: 250,
  streakDays: 0,
  lastReadDate: null
};

export const INITIAL_SETTINGS: ReadingSettings = {
  wpm: 250,
  chunkSize: 1,
  fontSize: 48,
  language: 'en'
};
