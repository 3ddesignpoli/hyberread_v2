
import React, { useState } from 'react';
import { UserStats, ScreenState, Book, ReadingSettings } from '../types';
import { THEME, LEVELS } from '../constants';
import { Play, TrendingUp, Clock, Zap, BookOpen, Globe, ChevronRight, Brain } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../translations';

interface HomeProps {
    stats: UserStats;
    recentBook: Book | null;
    onNavigate: (screen: ScreenState) => void;
    onContinueReading: (book: Book) => void;
    settings: ReadingSettings;
    onUpdateSettings: (settings: ReadingSettings) => void;
    t: (key: string) => string;
}

const HomeScreen: React.FC<HomeProps> = ({ stats, recentBook, onNavigate, onContinueReading, settings, onUpdateSettings, t }) => {
    const [showLangMenu, setShowLangMenu] = useState(false);

    const currentLevel = LEVELS.find(l => l.level === stats.level) || LEVELS[0];
    const nextLevel = LEVELS.find(l => l.level === stats.level + 1) || LEVELS[LEVELS.length - 1];

    // Calculate raw words remaining instead of just generic XP
    const wordsForCurrentLevel = currentLevel.xp * 10;
    const wordsForNextLevel = nextLevel.xp * 10;
    const currentWords = stats.xp * 10; // Convert XP back to words for display

    // Progress within the current bracket
    const progressPercent = Math.min(100, Math.max(0, ((stats.xp - currentLevel.xp) / (nextLevel.xp - currentLevel.xp)) * 100));
    const wordsRemaining = Math.max(0, wordsForNextLevel - currentWords);

    return (
        <div className="min-h-screen pb-24" style={{ backgroundColor: THEME.bgLight }}>
            {/* Hero Section */}
            <div
                className="relative h-auto min-h-[380px] flex flex-col justify-end pb-10 px-6 text-white overflow-hidden rounded-b-[3rem] shadow-2xl shadow-blue-900/20 pt-24"
                style={{
                    background: `linear-gradient(135deg, ${THEME.blue} 0%, ${THEME.green} 100%)`
                }}
            >
                <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

                {/* Top Bar */}
                <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-30">
                    <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                        <span className="text-blue-100 font-bold text-[10px] uppercase tracking-widest block opacity-70">{t('current_level')}</span>
                        <span className="text-white font-black text-xl">{stats.level}</span>
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setShowLangMenu(!showLangMenu)}
                            className="bg-white/20 backdrop-blur-md w-10 h-10 rounded-full flex items-center justify-center border border-white/10 hover:bg-white/30 transition-colors"
                        >
                            <Globe size={18} />
                        </button>

                        {showLangMenu && (
                            <div className="absolute right-0 top-12 bg-white rounded-[1.5rem] shadow-2xl py-3 w-48 z-50 text-gray-800 animate-in fade-in slide-in-from-top-2 duration-200 border border-gray-100">
                                {SUPPORTED_LANGUAGES.map(lang => (
                                    <button
                                        key={lang.code}
                                        onClick={() => {
                                            onUpdateSettings({ ...settings, language: lang.code });
                                            setShowLangMenu(false);
                                        }}
                                        className={`w-full text-left px-5 py-3 text-xs font-bold hover:bg-gray-50 flex items-center justify-between ${settings.language === lang.code ? 'text-blue-600' : 'text-gray-500'}`}
                                    >
                                        {lang.label}
                                        {settings.language === lang.code && <div className="w-2 h-2 rounded-full bg-blue-600"></div>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="relative z-10 mb-6">
                    <h1 className="text-3xl font-black mb-1">{t('ready_to_read')}</h1>
                    <p className="text-blue-100 text-sm font-medium opacity-80">{t('welcome_back')}</p>
                </div>

                {/* Level Progress */}
                <div className="bg-black/20 rounded-[2rem] p-6 backdrop-blur-md border border-white/10">
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60 block mb-1">{t('next_goal')}</span>
                            <span className="text-lg font-bold">{currentLevel.title} <ChevronRight className="inline opacity-50" size={16} /> {nextLevel.title}</span>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-black text-yellow-300">{wordsRemaining}</span>
                            <span className="text-[10px] font-bold block opacity-60 uppercase">{t('words_left')}</span>
                        </div>
                    </div>

                    <div className="h-3 bg-black/20 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-yellow-400 rounded-full shadow-[0_0_15px_rgba(250,204,21,0.6)] transition-all duration-1000 ease-out"
                            style={{ width: `${progressPercent}%` }}
                        ></div>
                    </div>

                    <div className="flex justify-between mt-2 text-[9px] font-bold opacity-40 uppercase tracking-widest">
                        <span>{currentWords.toLocaleString()} Words</span>
                        <span>{wordsForNextLevel.toLocaleString()} Words</span>
                    </div>
                </div>
            </div>

            <div className="px-6 -mt-8 relative z-20 space-y-6">

                {/* Continue Reading Card */}
                {recentBook ? (
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-blue-900/5 border border-gray-100/50">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">{t('continue_reading')}</h3>
                                <h2 className="text-xl font-bold text-gray-800 line-clamp-1 leading-tight">{recentBook.title}</h2>
                                <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">{recentBook.author}</p>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs shadow-sm">
                                {Math.round((recentBook.progress / recentBook.totalWords) * 100)}%
                            </div>
                        </div>

                        <button
                            onClick={() => onContinueReading(recentBook)}
                            className="w-full py-5 bg-gray-900 text-white rounded-[1.8rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-gray-800 active:scale-95 transition-all shadow-xl shadow-gray-200"
                        >
                            <Play size={16} fill="currentColor" /> {t('resume')}
                        </button>
                    </div>
                ) : (
                    <div
                        onClick={() => onNavigate(ScreenState.LIBRARY)}
                        className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-blue-900/5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors border border-gray-100"
                    >
                        <div>
                            <h2 className="text-lg font-black text-gray-800 mb-1">{t('start_book')}</h2>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{t('select_library')}</p>
                        </div>
                        <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shadow-lg shadow-blue-100">
                            <BookOpen size={24} />
                        </div>
                    </div>
                )}

                {/* Training Card */}
                <div
                    onClick={() => onNavigate(ScreenState.TRAINING)}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2.5rem] p-8 shadow-xl shadow-indigo-200 text-white flex items-center justify-between cursor-pointer active:scale-95 transition-all"
                >
                    <div>
                        <h2 className="text-lg font-black mb-1">{t('training_center')}</h2>
                        <p className="text-xs font-bold opacity-80 uppercase tracking-wide">{t('boost_focus')}</p>
                    </div>
                    <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                        <Brain size={24} fill="white" />
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                        <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mb-4">
                            <Zap size={22} />
                        </div>
                        <div className="text-3xl font-black text-gray-800 mb-1">{stats.currentWpm}</div>
                        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{t('current_wpm')}</div>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                        <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-500 flex items-center justify-center mb-4">
                            <Clock size={22} />
                        </div>
                        <div className="text-3xl font-black text-gray-800 mb-1">{Math.round(stats.totalTimeMinutes)}</div>
                        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{t('minutes_read')}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomeScreen;
