import { useEffect, useState, type ReactNode } from 'react';
import { storageService } from '../services/storageService';
import type { AppSettings } from '../types';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<AppSettings['theme']>('dark');

  useEffect(() => {
    const loadTheme = async () => {
      const settings = await storageService.getSettings();
      setTheme(settings.theme);
    };
    const handleSettingsChange = () => {
      void loadTheme();
    };

    void loadTheme();
    window.addEventListener('pensle:settings-changed', handleSettingsChange);
    return () => window.removeEventListener('pensle:settings-changed', handleSettingsChange);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return <>{children}</>;
}
