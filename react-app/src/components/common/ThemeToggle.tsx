import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

export const ThemeToggle: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const { t } = useLanguage();

  return (
    <button
      className="theme-toggle-btn"
      onClick={toggleTheme}
      title={isDark ? t.themeLight : t.themeDark}
      aria-label="Toggle Dark / Light Theme"
    >
      <span className="theme-toggle-icon">
        {isDark ? <Sun size={15} className="sun-icon" /> : <Moon size={15} className="moon-icon" />}
      </span>
      <span className="theme-toggle-text">{isDark ? t.themeLight : t.themeDark}</span>
    </button>
  );
};
