import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('geowatch-theme') as 'dark' | 'light' | null;
    const initial = saved || 'dark';
    setTheme(initial);
    document.documentElement.setAttribute('data-theme', initial);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('geowatch-theme', next);
  };

  return (
    <button
      onClick={toggleTheme}
      className="btn btn-secondary btn-sm"
      title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        border: '1px solid var(--border-subtle)',
        padding: '6px 12px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-card)',
        color: 'var(--text-primary)',
        cursor: 'pointer'
      }}
    >
      {theme === 'dark' ? (
        <>
          <Sun size={15} style={{ color: 'var(--amber-500)' }} />
          <span style={{ fontSize: '12px', fontWeight: 600 }}>Light</span>
        </>
      ) : (
        <>
          <Moon size={15} style={{ color: 'var(--emerald-600)' }} />
          <span style={{ fontSize: '12px', fontWeight: 600 }}>Dark</span>
        </>
      )}
    </button>
  );
};
