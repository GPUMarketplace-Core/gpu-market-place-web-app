'use client';

import React from 'react';
import { useTheme } from '../providers/ThemeProvider';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex items-center gap-2 px-3 py-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 group"
      aria-label="Toggle theme"
    >
      {/* Sun Icon */}
      <svg
        className={`w-5 h-5 transition-all duration-300 ${
          theme === 'light' ? 'text-yellow-500 scale-110' : 'text-gray-400 scale-90'
        }`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
          clipRule="evenodd"
        />
      </svg>

      {/* Slider */}
      <div className="relative w-11 h-6 bg-gradient-to-r from-violet-200 to-fuchsia-200 dark:from-violet-900 dark:to-fuchsia-900 rounded-full transition-colors duration-300">
        <div
          className={`absolute top-0.5 w-5 h-5 bg-white dark:bg-gray-200 rounded-full shadow-lg transition-all duration-300 ${
            theme === 'dark' ? 'left-[22px]' : 'left-0.5'
          }`}
        />
      </div>

      {/* Moon Icon */}
      <svg
        className={`w-5 h-5 transition-all duration-300 ${
          theme === 'dark' ? 'text-blue-400 scale-110' : 'text-gray-400 scale-90'
        }`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
      </svg>
    </button>
  );
}
