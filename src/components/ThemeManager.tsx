import { useEffect } from 'react';
import { setTheme } from '@ui5/webcomponents-base/dist/config/Theme.js';
import { useTheme } from '../hooks/useTheme.ts';

export function ThemeManager() {
  const { theme } = useTheme();

  useEffect(() => {
    void setTheme(theme);
  }, [theme]);

  return null;
}
