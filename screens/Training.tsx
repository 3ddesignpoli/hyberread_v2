import React, { useState, useEffect, useRef } from 'react';
import { Target, ArrowLeft, RefreshCw, BookOpen, Brain, Play, GraduationCap } from 'lucide-react';
import { LanguageCode, Lesson } from '../types';
import { THEME } from '../constants';
import { getLocalizedLessons } from '../translations';

interface TrainingProps {
  onBack: () => void;
  onStartLesson: (lesson: Lesson) => void;
  language: LanguageCode;
  t: (key: string) => string;
}

const TrainingScreen: React.FC<TrainingProps> = ({ onBack, onStartLesson, language, t }) => {
  const [activeTab, setActiveTab] = useState<'course' | 'gym'>('course');
  const [lessons, setLessons] = useState<Lesson[]>([]);

  useEffect(() => {
      setLessons(getLocalizedLessons(language));
  }, [language]);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col pb-24">
       {/* Header */}
      <div className="p-6 flex justify-between items-center bg-slate-800/50 backdrop-blur-md sticky top-0 z-20">
        <button onClick={onBack} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
            <ArrowLeft size={24} />
        </button>
        <h2 className="font-bold text-lg">{t('training_center')}</h2>
        <div className="w-10"></div>
      </div>

      {/* Tabs */}
      <div className="px-6 mb-6">
        <div className="bg-slate-800 p-1 rounded-xl flex">
            <button 
                onClick={() => setActiveTab('course')}
                className={`flex-1 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${activeTab === 'course' ? 'bg-teal-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
                <GraduationCap size={18} /> {t('course')}
            </button>
            <button 
                onClick={() => setActiveTab('gym')}
                className={`flex-1 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${activeTab === 'gym' ? 'bg-teal-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
                <Target size={18} /> {t('eye_gym')}
            </button>
        </div>
      </div>

      {activeTab === 'course' ? (
        <div className="px-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-gradient-to-br from-indigo-600 to-blue-500 p-6 rounded-3xl shadow-lg mb-6">
                <h3 className="text-2xl font-bold mb-2">{t('master_speed')}</h3>
                <p className="text-indigo-100 mb-4 text-sm">{t('course_desc')}</p>
                <div className="h-1 bg-black/20 rounded-full w-full">
                    <div className="h-full bg-white/40 rounded-full w-1/3"></div>
                </div>
            </div>

            <h3 className="font-bold text-slate-400 text-sm uppercase tracking-wider mb-2">{t('core_lessons')}</h3>
            
            {lessons.map((lesson, index) => (
                <div 
                    key={lesson.id} 
                    onClick={() => onStartLesson(lesson)}
                    className="bg-slate-800 rounded-2xl p-5 border border-slate-700 hover:border-teal-500/50 transition-all cursor-pointer group active:scale-95"
                >
                    <div className="flex justify-between items-start mb-3">
                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-teal-400 group-hover:bg-teal-500 group-hover:text-white transition-colors">
                            {index + 1}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                            lesson.difficulty === 'Beginner' ? 'bg-green-500/20 text-green-400' : 
                            lesson.difficulty === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                        }`}>
                            {lesson.difficulty}
                        </span>
                    </div>
                    <h4 className="font-bold text-lg mb-1">{lesson.title}</h4>
                    <p className="text-slate-400 text-sm mb-4">{lesson.description}</p>
                    <div className="flex items-center gap-2 text-xs font-bold text-teal-400">
                        <Play size={14} fill="currentColor" /> {t('start_lesson')}
                    </div>
                </div>
            ))}
        </div>
      ) : (
        <SaccadeGame t={t} />
      )}
    </div>
  );
};

// Extracted the Saccade Game to a sub-component for cleanliness
const SaccadeGame = ({ t }: { t: (key: string) => string }) => {
    const [isActive, setIsActive] = useState(false);
    const [timeLeft, setTimeLeft] = useState(30);
    const [ballPos, setBallPos] = useState({ x: 50, y: 50 });
    const containerRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isActive && timeLeft > 0) {
        interval = setInterval(() => {
            setTimeLeft(prev => prev - 1);
            setBallPos({
                x: Math.random() * 90 + 5,
                y: Math.random() * 90 + 5
            });
        }, 800); 
        } else if (timeLeft === 0) {
        setIsActive(false);
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const toggleSession = () => {
        if (timeLeft === 0) setTimeLeft(30);
        setIsActive(!isActive);
    };

    return (
        <div className="px-6 h-full flex flex-col flex-1 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex-1 relative overflow-hidden bg-slate-800 rounded-3xl border border-slate-700 shadow-inner mb-6" ref={containerRef}>
                {!isActive && timeLeft === 30 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-10 text-center p-8">
                        <Target size={64} className="text-teal-400 mb-4" />
                        <h3 className="text-2xl font-bold mb-2">{t('focus_exercise')}</h3>
                        <p className="text-slate-300 mb-8">{t('focus_desc')}</p>
                        <button 
                            onClick={toggleSession}
                            className="px-8 py-4 bg-teal-500 text-white font-bold rounded-2xl shadow-lg shadow-teal-500/30 hover:bg-teal-400 transition-all active:scale-95"
                        >
                            {t('start_session')}
                        </button>
                    </div>
                )}

                {timeLeft === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-10 text-center p-8">
                        <h3 className="text-3xl font-bold mb-2 text-white">{t('complete')}</h3>
                        <p className="text-slate-300 mb-8">{t('great_job')}</p>
                        <button 
                            onClick={toggleSession}
                            className="flex items-center gap-2 px-8 py-4 bg-white text-slate-900 font-bold rounded-2xl shadow-lg hover:bg-gray-100 transition-all active:scale-95"
                        >
                            <RefreshCw size={20} /> {t('again')}
                        </button>
                    </div>
                )}

                <div 
                    className="absolute w-6 h-6 bg-teal-400 rounded-full shadow-[0_0_20px_rgba(45,212,191,0.8)] transition-all duration-700 ease-in-out"
                    style={{ 
                        left: `${ballPos.x}%`, 
                        top: `${ballPos.y}%`,
                        transform: 'translate(-50%, -50%)',
                        opacity: isActive ? 1 : 0
                    }}
                >
                    <div className="absolute inset-0 rounded-full animate-ping bg-teal-400 opacity-50"></div>
                </div>
            </div>

            <div className="bg-slate-800 rounded-2xl p-6 text-center border border-slate-700">
                <span className="text-slate-400 text-sm uppercase tracking-wider">{t('time_remaining')}</span>
                <div className="text-5xl font-bold font-mono text-white mt-2">
                    00:{timeLeft.toString().padStart(2, '0')}
                </div>
            </div>
        </div>
    );
};

export default TrainingScreen;