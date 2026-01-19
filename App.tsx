
import React, { useState, useEffect, useCallback } from 'react';
import Navigation from './components/Navigation';
import { Book, ReadingSettings, ScreenState, UserStats, Lesson, LanguageCode } from './types';
import { INITIAL_SETTINGS, INITIAL_STATS, THEME, LEVELS } from './constants';
import HomeScreen from './screens/Home';
import LibraryScreen from './screens/Library';
import ReaderScreen from './screens/Reader';
import TrainingScreen from './screens/Training';
import { Zap, Trophy, TrendingUp, Clock, Target, Lock, CheckCircle2 } from 'lucide-react';
import { processTextContent } from './services/epubService';
import { SUPPORTED_LANGUAGES, getLocalizedLessons, getTranslation } from './translations';

const App: React.FC = () => {
    const [screen, setScreen] = useState<ScreenState>(ScreenState.SPLASH);
    const [books, setBooks] = useState<Book[]>([]);
    const [activeBook, setActiveBook] = useState<Book | null>(null);
    const [stats, setStats] = useState<UserStats>(INITIAL_STATS);
    const [settings, setSettings] = useState<ReadingSettings>(INITIAL_SETTINGS);

    const t = useCallback((key: string) => getTranslation(settings.language, key), [settings.language]);

    useEffect(() => {
        const savedBooks = localStorage.getItem('hyperread_books');
        const savedStats = localStorage.getItem('hyperread_stats');
        const savedSettings = localStorage.getItem('hyperread_settings');
        if (savedBooks) setBooks(JSON.parse(savedBooks));
        if (savedStats) setStats(JSON.parse(savedStats));
        if (savedSettings) setSettings(JSON.parse(savedSettings));
        else {
            const browserLang = navigator.language.split('-')[0] as LanguageCode;
            if (SUPPORTED_LANGUAGES.some(l => l.code === browserLang)) {
                setSettings(prev => ({ ...prev, language: browserLang }));
            }
        }
        const timer = setTimeout(() => setScreen(ScreenState.HOME), 2000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const langConfig = SUPPORTED_LANGUAGES.find(l => l.code === settings.language);
        document.documentElement.dir = langConfig?.dir || 'ltr';
        document.documentElement.lang = settings.language;
    }, [settings.language]);

    useEffect(() => { localStorage.setItem('hyperread_books', JSON.stringify(books)); }, [books]);
    useEffect(() => { localStorage.setItem('hyperread_stats', JSON.stringify(stats)); }, [stats]);
    useEffect(() => { localStorage.setItem('hyperread_settings', JSON.stringify(settings)); }, [settings]);

    const handleAddBook = useCallback((book: Book) => setBooks(prev => [book, ...prev]), []);
    const handleDeleteBook = useCallback((id: string) => {
        setBooks(prev => prev.filter(b => b.id !== id));
        setActiveBook(prev => (prev?.id === id ? null : prev));
    }, []);
    const handleSelectBook = useCallback((book: Book) => { setActiveBook(book); setScreen(ScreenState.READER); }, []);

    const handleStartLesson = useCallback((lesson: Lesson) => {
        const { words, chapters } = processTextContent(lesson.content);
        const lessonBook: Book = {
            id: lesson.id,
            title: lesson.title,
            author: 'Coach',
            content: words,
            chapters: chapters,
            coverColor: THEME.blue,
            progress: 0,
            totalWords: words.length,
            addedAt: Date.now(),
            type: 'lesson'
        };
        setActiveBook(lessonBook);
        setScreen(ScreenState.READER);
    }, []);

    const handleUpdateProgress = useCallback((bookId: string, progress: number) => {
        setBooks(prev => prev.map(b => b.id === bookId ? { ...b, progress } : b));
        setActiveBook(prev => (prev && prev.id === bookId ? { ...prev, progress } : prev));
    }, []);

    // Updated Leveling Logic: 1 XP = 10 Words.
    const handleUpdateStats = useCallback((wordsRead: number, timeSeconds: number) => {
        setStats(prev => {
            const newXp = prev.xp + (wordsRead / 10);
            // Find the highest level where current XP is greater than required XP
            const newLevelData = [...LEVELS].reverse().find(l => newXp >= l.xp) || LEVELS[0];

            return {
                ...prev,
                xp: newXp,
                level: newLevelData.level,
                totalWordsRead: prev.totalWordsRead + wordsRead,
                totalTimeMinutes: prev.totalTimeMinutes + (timeSeconds / 60)
            };
        });
    }, []);

    if (screen === ScreenState.SPLASH) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-blue-600 text-white">
                <Zap size={64} className="mb-4 animate-bounce" fill="white" />
                <h1 className="text-4xl font-bold mb-2">KYAC Hyperread Pro</h1>
            </div>
        );
    }

    if (screen === ScreenState.READER && activeBook) {
        return (<ReaderScreen book={activeBook} settings={settings} onUpdateProgress={handleUpdateProgress} onUpdateStats={handleUpdateStats} onUpdateSettings={setSettings} onClose={() => setScreen(ScreenState.HOME)} t={t} />);
    }

    if (screen === ScreenState.TRAINING) {
        return (<TrainingScreen onBack={() => setScreen(ScreenState.HOME)} onStartLesson={handleStartLesson} language={settings.language} t={t} />);
    }

    return (
        <>
            {screen === ScreenState.HOME && <HomeScreen stats={stats} recentBook={activeBook || (books.length > 0 ? books[0] : null)} onNavigate={setScreen} onContinueReading={handleSelectBook} settings={settings} onUpdateSettings={setSettings} t={t} />}
            {screen === ScreenState.LIBRARY && <LibraryScreen books={books} onSelectBook={handleSelectBook} onAddBook={handleAddBook} onDeleteBook={handleDeleteBook} t={t} language={settings.language} />}

            {screen === ScreenState.STATS && (
                <div className="min-h-screen pb-24 bg-gray-50 flex flex-col">
                    <div className="bg-white p-6 shadow-sm border-b sticky top-0 z-10">
                        <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">{t('stats_dashboard')}</h2>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">{t('track_progress')}</p>
                    </div>

                    <div className="p-6 space-y-6 overflow-y-auto">
                        {/* Top Stats Cards */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                                    <TrendingUp size={20} />
                                </div>
                                <div className="text-2xl font-black text-gray-800">{stats.totalWordsRead.toLocaleString()}</div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('total_words')}</div>
                            </div>
                            <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                                <div className="w-10 h-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center mb-3">
                                    <Clock size={20} />
                                </div>
                                <div className="text-2xl font-black text-gray-800">{Math.round(stats.totalTimeMinutes)}</div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('minutes_read')}</div>
                            </div>
                        </div>

                        {/* Level Progress Journey */}
                        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                            <h3 className="text-lg font-black text-gray-800 mb-6 flex items-center gap-2">
                                <Trophy className="text-yellow-500" size={24} /> {t('your_journey')}
                            </h3>

                            <div className="relative pl-4 border-l-2 border-gray-100 space-y-8">
                                {LEVELS.map((lvl) => {
                                    const isUnlocked = stats.level >= lvl.level;
                                    const isCurrent = stats.level === lvl.level;

                                    return (
                                        <div key={lvl.level} className={`relative transition-all ${isUnlocked ? 'opacity-100' : 'opacity-40 grayscale'}`}>
                                            <div className={`absolute -left-[25px] top-0 w-5 h-5 rounded-full border-4 ${isCurrent ? 'border-blue-500 bg-white scale-125' : isUnlocked ? 'border-green-500 bg-green-500' : 'border-gray-200 bg-white'}`}></div>

                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className={`font-black text-sm uppercase tracking-wider ${isCurrent ? 'text-blue-600' : 'text-gray-800'}`}>
                                                        {t('level')} {lvl.level}: {lvl.title}
                                                    </h4>
                                                    <p className="text-xs text-gray-500 mt-1">{lvl.desc}</p>
                                                </div>
                                                {isUnlocked ? (
                                                    <CheckCircle2 className="text-green-500" size={20} />
                                                ) : (
                                                    <Lock className="text-gray-300" size={16} />
                                                )}
                                            </div>

                                            <div className="mt-2 text-[10px] font-bold bg-gray-100 inline-block px-2 py-1 rounded-md text-gray-500">
                                                {lvl.xp * 10} {t('words_required')}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <Navigation currentScreen={screen} onNavigate={setScreen} t={t} />
        </>
    );
};

export default App;
