
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Play, Pause, Settings, X, BookmarkCheck, Layout, Zap, ChevronLeft, ChevronRight, Type, MapPin, AlertTriangle, List, Search, Moon, Sun, Book as BookIcon, Info, Compass } from 'lucide-react';
import { Book, ReadingSettings, ViewMode } from '../types';
import { THEME } from '../constants';
import { PARA_TOKEN } from '../services/epubService';

interface ReaderProps {
  book: Book;
  settings: ReadingSettings;
  onUpdateProgress: (bookId: string, progress: number) => void;
  onUpdateStats: (wordsRead: number, timeSeconds: number) => void;
  onUpdateSettings: (settings: ReadingSettings) => void;
  onClose: () => void;
  t: (key: string) => string;
}

const WORDS_PER_PAGE = 250;

const ReaderScreen: React.FC<ReaderProps> = ({
  book,
  settings,
  onUpdateProgress,
  onUpdateStats,
  onUpdateSettings,
  onClose,
  t
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('PAGE');
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewIndex, setViewIndex] = useState(book.progress);
  const [bookmarkIndex, setBookmarkIndex] = useState(book.progress);
  const [showSettings, setShowSettings] = useState(false);
  const [showChapters, setShowChapters] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [showConfirmMove, setShowConfirmMove] = useState<number | null>(null);
  const [themeMode, setThemeMode] = useState<'day' | 'sepia' | 'night'>('day');
  const [showIntro, setShowIntro] = useState(book.progress === 0);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const sessionWordsRef = useRef<number>(0);
  const indexRef = useRef(book.progress);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const wakeLockRef = useRef<any>(null);

  const requestWakeLock = useCallback(async () => {
    if ('wakeLock' in navigator) {
      try {
        // @ts-ignore
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      } catch (err: any) { }
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current !== null) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      } catch (err: any) { }
    }
  }, []);

  useEffect(() => {
    requestWakeLock();
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') await requestWakeLock();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseWakeLock();
    };
  }, [requestWakeLock, releaseWakeLock]);

  useEffect(() => { indexRef.current = bookmarkIndex; }, [bookmarkIndex]);

  const saveSession = useCallback(() => {
    onUpdateProgress(book.id, indexRef.current);
    if (startTimeRef.current) {
      const elapsedSeconds = (Date.now() - startTimeRef.current) / 1000;
      if (sessionWordsRef.current > 0) onUpdateStats(sessionWordsRef.current, elapsedSeconds);
      startTimeRef.current = null;
      sessionWordsRef.current = 0;
    }
  }, [book.id, onUpdateProgress, onUpdateStats]);

  useEffect(() => { return () => saveSession(); }, [saveSession]);

  useEffect(() => {
    if (viewMode === 'PAGE' && scrollContainerRef.current) {
      const wordElement = document.getElementById(`word-${viewIndex}`);
      if (wordElement) wordElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [viewIndex, viewMode]);

  const togglePulseMode = () => {
    if (isPlaying) {
      setIsPlaying(false);
      saveSession();
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 2000);
    } else {
      setViewMode('RSVP');

      // Force sync: Always start reading from the current visible word index
      // This ensures "Start Reading" always picks up exactly where the user is looking/clicked
      setBookmarkIndex(viewIndex);
      indexRef.current = viewIndex;

      setIsPlaying(true);
      startTimeRef.current = Date.now();
    }
  };

  useEffect(() => {
    if (!isPlaying) return;
    const scheduleNextWord = () => {
      let nextIndex = indexRef.current + 1;
      if (nextIndex >= book.content.length) {
        setIsPlaying(false);
        saveSession();
        return;
      }
      while (book.content[nextIndex] === PARA_TOKEN && nextIndex < book.content.length - 1) nextIndex++;
      const currentWord = book.content[indexRef.current] || "";
      let baseDelay = 60000 / settings.wpm;
      if (/[.,!?;:]/.test(currentWord.slice(-1))) baseDelay += 200;
      if (currentWord.length > 9) baseDelay *= 1.4;

      timeoutRef.current = setTimeout(() => {
        indexRef.current = nextIndex;
        setBookmarkIndex(nextIndex);
        setViewIndex(nextIndex);
        sessionWordsRef.current += 1;
        scheduleNextWord();
      }, baseDelay);
    };
    scheduleNextWord();
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [isPlaying, settings.wpm, book.content.length, saveSession]);

  const currentThemeStyles = useMemo(() => {
    switch (themeMode) {
      case 'night': return { bg: 'bg-[#121212]', text: 'text-gray-300', accent: 'text-blue-400', border: 'border-white/10' };
      case 'sepia': return { bg: 'bg-[#f4ecd8]', text: 'text-[#5b4636]', accent: 'text-[#8e6c53]', border: 'border-[#e4dcc8]' };
      default: return { bg: 'bg-white', text: 'text-gray-800', accent: 'text-blue-600', border: 'border-gray-100' };
    }
  }, [themeMode]);

  const currentPage = Math.floor(viewIndex / WORDS_PER_PAGE) + 1;
  const totalPages = Math.ceil(book.content.length / WORDS_PER_PAGE);

  const getChapterAt = (idx: number) => {
    if (!book.chapters) return null;
    return [...book.chapters].reverse().find(c => c.startIndex <= idx);
  };

  const currentChapter = getChapterAt(viewIndex);

  return (
    <div className={`fixed inset-0 ${currentThemeStyles.bg} z-50 flex flex-col font-sans overflow-hidden transition-colors duration-500`}>
      {/* Intro Modal */}
      {showIntro && (
        <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-xl flex items-center justify-center p-6">
          <button onClick={() => setShowIntro(false)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>

          <div className="w-20 h-20 bg-blue-600 text-white rounded-3xl flex items-center justify-center mb-8 mx-auto shadow-2xl shadow-blue-200">
            <Zap size={40} fill="white" />
          </div>
          <h2 className="text-2xl font-black text-gray-800 text-center mb-2">{book.progress === 0 && book.type === 'lesson' ? t('ready_to_read') : t('welcome_back')}</h2>
          <p className="text-gray-400 text-center text-sm mb-8 uppercase tracking-widest font-bold">{book.title}</p>

          <div className="bg-blue-50 rounded-3xl p-6 mb-10 border border-blue-100">
            <h4 className="flex items-center gap-2 font-black text-blue-800 text-xs uppercase tracking-widest mb-3">
              <Info size={16} /> {t('eye_training')}
            </h4>
            <p className="text-blue-700/70 text-sm leading-relaxed">
              {t('course_desc')}
            </p>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowIntro(false);
            }}
            className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-2xl shadow-blue-300 active:scale-95 transition-all"
          >
            {t('start_reading')}
          </button>
        </div>


{/* Settings Modal */}
      {
        showSettings && (
          <div className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-md flex items-end sm:items-center justify-center p-4" onClick={() => setShowSettings(false)}>
            <div className={`w-full max-w-sm ${currentThemeStyles.bg} rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300 border ${currentThemeStyles.border}`} onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h3 className={`font-black uppercase tracking-widest text-sm flex items-center gap-2 ${currentThemeStyles.text}`}>
                  <Settings size={20} className={currentThemeStyles.accent} /> {t('reading_settings')}
                </h3>
                <button onClick={() => setShowSettings(false)} className={`p-2 hover:bg-black/5 rounded-full ${currentThemeStyles.text}`}><X size={20} /></button>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-xs font-bold uppercase tracking-wider opacity-60 ${currentThemeStyles.text}`}>{t('speed_wpm')}</span>
                    <span className="font-black text-xl text-blue-600">{settings.wpm}</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="1000"
                    step="10"
                    value={settings.wpm}
                    onChange={(e) => onUpdateSettings({ ...settings, wpm: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-[10px] opacity-40 font-bold mt-1">
                    <span>Slow</span>
                    <span>Fast</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-xs font-bold uppercase tracking-wider opacity-60 ${currentThemeStyles.text}`}>{t('font_size')}</span>
                    <span className="font-black text-xl text-blue-600">{settings.fontSize}px</span>
                  </div>
                  <div className="flex items-center gap-4 bg-black/5 p-2 rounded-xl">
                    <button onClick={() => onUpdateSettings({ ...settings, fontSize: Math.max(12, settings.fontSize - 2) })} className={`p-3 rounded-lg bg-white shadow-sm flex-1 flex justify-center active:scale-95 transition-all text-gray-800`}><Type size={16} /></button>
                    <button onClick={() => onUpdateSettings({ ...settings, fontSize: Math.min(48, settings.fontSize + 2) })} className={`p-3 rounded-lg bg-white shadow-sm flex-1 flex justify-center active:scale-95 transition-all text-gray-800`}><Type size={24} /></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Chapters Modal */}
      {
        showChapters && (
          <div className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-md flex justify-start">
            <div className={`w-80 h-full ${currentThemeStyles.bg} shadow-2xl border-r ${currentThemeStyles.border} p-6 animate-in slide-in-from-left duration-300`}>
              <div className="flex justify-between items-center mb-10">
                <h3 className={`font-black uppercase tracking-widest text-sm flex items-center gap-2 ${currentThemeStyles.text}`}>
                  <List size={20} className={currentThemeStyles.accent} /> {t('core_lessons')}
                </h3>
                <button onClick={() => setShowChapters(false)} className={`p-2 hover:bg-black/5 rounded-full ${currentThemeStyles.text}`}><X size={20} /></button>
              </div>
              <div className="space-y-2 overflow-y-auto h-[80vh] pr-2 scrollbar-hide">
                {book.chapters?.map((chap, i) => (
                  <button
                    key={i}
                    onClick={() => { setViewIndex(chap.startIndex); setShowChapters(false); }}
                    className={`w-full text-left p-4 rounded-2xl transition-all ${viewIndex >= chap.startIndex && (!book.chapters?.[i + 1] || viewIndex < book.chapters[i + 1].startIndex) ? 'bg-blue-600 text-white shadow-lg' : `hover:bg-black/5 ${currentThemeStyles.text}`}`}
                  >
                    <span className="text-[10px] opacity-60 block font-bold mb-1 uppercase tracking-tighter">{t('page')} {Math.floor(chap.startIndex / WORDS_PER_PAGE) + 1}</span>
                    <span className="font-bold text-sm line-clamp-2 leading-snug">{chap.title}</span>
                  </button>
                ))}
                {(!book.chapters || book.chapters.length === 0) && (
                  <p className="text-gray-400 text-sm italic">{t('no_results')}</p>
                )}
              </div>
            </div>
            <div className="flex-1" onClick={() => setShowChapters(false)}></div>
          </div>
        )
      }

      {/* App Bar */}
      <div className={`flex justify-between items-center px-6 py-4 border-b ${currentThemeStyles.border} ${currentThemeStyles.bg} z-30`}>
        <div className="flex items-center gap-4">
          <button onClick={() => { saveSession(); onClose(); }} className={`p-2 hover:bg-black/5 rounded-full transition-all ${currentThemeStyles.text}`}>
            <ChevronLeft size={24} />
          </button>
          <div className="hidden sm:block">
            <h2 className={`text-[10px] font-black uppercase tracking-[0.2em] max-w-[200px] truncate ${currentThemeStyles.text}`}>{book.title}</h2>
            <p className={`text-[9px] font-bold uppercase tracking-widest opacity-40 ${currentThemeStyles.text}`}>{currentChapter?.title || book.author}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-black/5 rounded-xl p-1">
            <button onClick={() => setThemeMode('day')} className={`p-2 rounded-lg ${themeMode === 'day' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}><Sun size={16} /></button>
            <button onClick={() => setThemeMode('sepia')} className={`p-2 rounded-lg ${themeMode === 'sepia' ? 'bg-[#f4ecd8] shadow-sm text-[#5b4636]' : 'text-gray-400'}`}><div className="w-4 h-4 rounded-full bg-[#f4ecd8] border border-black/10" /></button>
            <button onClick={() => setThemeMode('night')} className={`p-2 rounded-lg ${themeMode === 'night' ? 'bg-[#121212] shadow-sm text-blue-400' : 'text-gray-400'}`}><Moon size={16} /></button>
          </div>
          <button onClick={() => setShowSettings(!showSettings)} className={`p-2.5 rounded-xl hover:bg-black/5 transition-all ${currentThemeStyles.text}`}>
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative overflow-hidden">
        {viewMode === 'PAGE' ? (
          <div
            ref={scrollContainerRef}
            className="h-full overflow-y-auto px-6 py-12 leading-[2] scrollbar-hide max-w-2xl mx-auto"
          >
            {/* Real Book Styles */}
            <div
              className={`text-justify mb-40 select-none ${currentThemeStyles.text}`}
              style={{
                fontSize: `${Math.max(16, settings.fontSize * 0.45)}px`,
                fontFamily: "'Georgia', 'Merriweather', serif",
                wordSpacing: '0.05em'
              }}
            >
              {book.content.map((word, idx) => {
                const isHeading = book.chapters?.some(c => c.startIndex === idx);
                const isPara = word === PARA_TOKEN;

                if (isPara) return <div key={idx} className="h-8 w-full" />;
                if (isHeading) {
                  const chapter = book.chapters?.find(c => c.startIndex === idx);
                  return (
                    <div key={idx} className="text-center my-16 py-8 border-y border-black/5">
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 block mb-4">Bölüm</span>
                      <h2 className="text-3xl font-black uppercase tracking-tight leading-tight">{chapter?.title}</h2>
                    </div>
                  );
                }

                return (
                  <span
                    key={idx}
                    id={`word-${idx}`}
                    onClick={() => {
                      setViewIndex(idx);
                      setBookmarkIndex(idx); // Update bookmark immediately on click
                    }}
                    className={`inline-block cursor-pointer px-0.5 rounded transition-all duration-300 ${idx === bookmarkIndex
                      ? `border-b-2 ${currentThemeStyles.accent} font-bold`
                      : idx === viewIndex
                        ? 'bg-blue-600 text-white font-bold scale-110 shadow-lg z-10 px-1'
                        : 'hover:bg-black/5 opacity-90'
                      }`}
                  >
                    {word}
                  </span>
                );
              })}
              <div className="h-60" />
            </div>
          </div>
        ) : (
          /* Pulse Engine */
          <div className={`h-full flex flex-col items-center justify-center cursor-pointer select-none ${currentThemeStyles.bg} p-10`} onClick={togglePulseMode}>
            <div className={`absolute top-1/2 left-0 right-0 h-px ${currentThemeStyles.border} opacity-50`}></div>
            <div className={`absolute top-1/4 bottom-1/4 left-1/2 w-px ${currentThemeStyles.border} opacity-50`}></div>
            <div className="relative z-10 w-full flex justify-center items-center h-64 overflow-hidden">
              {(() => {
                const word = book.content[bookmarkIndex] || "";
                if (word === PARA_TOKEN) return <div className="text-gray-400 font-bold uppercase tracking-widest text-lg animate-pulse">--- NEXT ---</div>;
                const orpIndex = Math.floor((word.length - 1) * 0.4);
                return (
                  <div className={`flex items-baseline font-mono font-medium tracking-tight ${currentThemeStyles.text}`} style={{ fontSize: `${settings.fontSize}px` }}>
                    <span className="text-right min-w-[7ch] pr-[0.1ch] opacity-40">{word.slice(0, orpIndex)}</span>
                    <span className="text-red-500 font-black relative">
                      {word[orpIndex]}
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-[2px] h-6 bg-red-500/30"></div>
                      <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-[2px] h-6 bg-red-500/30"></div>
                    </span>
                    <span className="text-left min-w-[7ch] pl-[0.1ch] opacity-40">{word.slice(orpIndex + 1)}</span>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Navigation & Controls */}
      <div className={`px-8 py-6 border-t ${currentThemeStyles.border} ${currentThemeStyles.bg} z-30 shadow-[0_-20px_50px_rgba(0,0,0,0.05)]`}>
        <div className="flex items-center gap-6 mb-8 group">
          <span className={`text-[10px] font-black w-10 tabular-nums ${currentThemeStyles.text} opacity-30`}>
            {Math.round((viewIndex / (book.content.length || 1)) * 100)}%
          </span>
          <div className="flex-1 h-1.5 bg-black/5 rounded-full overflow-hidden relative">
            <div className="absolute top-0 left-0 h-full bg-blue-600 transition-all duration-300 rounded-full" style={{ width: `${(viewIndex / (book.content.length || 1)) * 100}%` }} />
            <input type="range" min="0" max={book.content.length - 1} value={viewIndex} onChange={(e) => setViewIndex(parseInt(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
          </div>
          <span className={`text-[10px] font-black w-10 text-right ${currentThemeStyles.text} opacity-30`}>{currentPage} / {totalPages}</span>
        </div>

        <div className="flex justify-between items-center max-w-lg mx-auto">
          <button onClick={() => setShowChapters(true)} className={`p-4 rounded-[1.5rem] bg-black/5 hover:bg-black/10 transition-all ${currentThemeStyles.text}`}><List size={24} /></button>

          <div className="flex items-center gap-4">
            <button onClick={() => setViewIndex(Math.max(0, viewIndex - WORDS_PER_PAGE))} className={`p-3 rounded-2xl hover:bg-black/5 transition-all active:scale-90 ${currentThemeStyles.text}`}><ChevronLeft size={28} /></button>
            <button
              onClick={togglePulseMode}
              className={`w-20 h-20 rounded-[2.2rem] flex items-center justify-center text-white shadow-2xl transition-all active:scale-95 ${isPlaying ? 'bg-orange-500 shadow-orange-200' : 'bg-blue-600 shadow-blue-200'}`}
            >
              {isPlaying ? <Pause size={32} fill="white" /> : <Play size={32} fill="white" className="ml-1" />}
            </button>
            <button onClick={() => setViewIndex(Math.min(book.content.length - 1, viewIndex + WORDS_PER_PAGE))} className={`p-3 rounded-2xl hover:bg-black/5 transition-all active:scale-90 ${currentThemeStyles.text}`}><ChevronRight size={28} /></button>
          </div>

          <button
            onClick={() => { setViewMode(viewMode === 'PAGE' ? 'RSVP' : 'PAGE'); setIsPlaying(false); }}
            className={`p-4 rounded-[1.5rem] transition-all flex items-center gap-2 ${viewMode === 'PAGE' ? currentThemeStyles.text : 'bg-blue-600 text-white shadow-lg'}`}
          >
            {viewMode === 'PAGE' ? <BookIcon size={24} /> : <Zap size={24} fill="white" />}
          </button>
        </div>
      </div>
    </div >
  );
};

export default ReaderScreen;
