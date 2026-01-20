import React from 'react';
import { Language } from '../types';
import { useConfig } from '../hooks/useConfig';

interface HeaderProps {
  currentLanguage: Language;
  setLanguage: (lang: Language) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentLanguage, setLanguage, theme, toggleTheme }) => {
  const { texts, clinic } = useConfig();

  // Dynamic Logo Logic: Url -> First Letter of Name -> 'D'
  const logoContent = clinic.logoUrl ? (
    <img src={clinic.logoUrl} alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
  ) : (
    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
      {clinic.name.charAt(0).toUpperCase()}
    </div>
  );

  return (
    <header className="flex justify-between items-center p-4 border-b bg-white dark:bg-slate-800 dark:border-slate-700 sticky top-0 z-50 shadow-sm transition-colors duration-300">
      <div className="flex items-center space-x-2">
        {logoContent}
        <div>
          <h1 className="text-lg font-bold text-secondary dark:text-white leading-tight hidden sm:block">{clinic.name}</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:block">{texts.dentalClinic[currentLanguage]}</p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Trust Badge */}
        <div className="flex items-center space-x-1 text-gray-400 dark:text-slate-500 text-xs">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-teal-600 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="hidden sm:inline text-gray-500 dark:text-slate-400">Verified Secure</span>
        </div>

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