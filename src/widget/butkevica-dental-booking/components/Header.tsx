import React from 'react';
import { Language } from '../types';
import { useTexts } from '../hooks/useConfig';

interface HeaderProps {
  currentLanguage: Language;
  setLanguage: (lang: Language) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentLanguage, setLanguage, theme, toggleTheme }) => {
  const texts = useTexts();
  return (
    <header className="flex justify-between items-center p-4 border-b bg-white dark:bg-slate-800 dark:border-slate-700 sticky top-0 z-50 shadow-sm transition-colors duration-300">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
          B
        </div>
        <div>
          <h1 className="text-lg font-bold text-secondary dark:text-white leading-tight hidden sm:block">Butkeviča</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:block">{texts.dentalClinic[currentLanguage]}</p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-700 transition-colors"
          aria-label="Toggle Dark Mode"
        >
          {theme === 'light' ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          )}
        </button>

        <div className="flex space-x-1 bg-gray-100 dark:bg-slate-700 p-1 rounded-lg transition-colors duration-300">
          {Object.values(Language).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`px-3 py-1 text-sm rounded-md transition-all ${currentLanguage === lang
                ? 'bg-white dark:bg-slate-600 text-primary dark:text-teal-400 shadow-sm font-medium'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};

export default Header;