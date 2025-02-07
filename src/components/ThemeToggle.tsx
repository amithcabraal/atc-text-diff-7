import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';

interface ThemeToggleProps {
  theme: 'light' | 'dark' | 'system';
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, onThemeChange }) => {
  return (
    <div className="flex items-center gap-2 p-2">
      <button
        onClick={() => onThemeChange('light')}
        className={`p-2 rounded-lg ${
          theme === 'light' ? 'bg-blue-100 dark:bg-blue-800' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
      >
        <Sun className="w-5 h-5" />
      </button>
      <button
        onClick={() => onThemeChange('dark')}
        className={`p-2 rounded-lg ${
          theme === 'dark' ? 'bg-blue-100 dark:bg-blue-800' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
      >
        <Moon className="w-5 h-5" />
      </button>
      <button
        onClick={() => onThemeChange('system')}
        className={`p-2 rounded-lg ${
          theme === 'system' ? 'bg-blue-100 dark:bg-blue-800' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
      >
        <Monitor className="w-5 h-5" />
      </button>
    </div>
  );
};