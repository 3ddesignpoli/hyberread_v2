import React from 'react';
import { Home, BookOpen, Library, TrendingUp } from 'lucide-react';
import { ScreenState } from '../types';

interface NavigationProps {
  currentScreen: ScreenState;
  onNavigate: (screen: ScreenState) => void;
  t: (key: string) => string;
}

const Navigation: React.FC<NavigationProps> = ({ currentScreen, onNavigate, t }) => {
  const navItems = [
    { id: ScreenState.HOME, icon: Home, label: t('nav_home') },
    { id: ScreenState.READER, icon: BookOpen, label: t('nav_read') },
    { id: ScreenState.LIBRARY, icon: Library, label: t('nav_library') },
    { id: ScreenState.STATS, icon: TrendingUp, label: t('nav_stats') }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-200 px-6 py-3 flex justify-between items-center z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
      {navItems.map(item => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          className={`flex flex-col items-center gap-1 transition-all duration-300 ${
            currentScreen === item.id 
              ? 'text-blue-600 transform -translate-y-1' 
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <item.icon size={24} strokeWidth={currentScreen === item.id ? 2.5 : 2} />
          <span className={`text-[10px] font-medium ${currentScreen === item.id ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
};

export default Navigation;