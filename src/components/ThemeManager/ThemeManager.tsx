import { useEffect } from 'react';
import { setTheme } from '@ui5/webcomponents-base/dist/config/Theme.js';
import { useIsDarkModePreferred } from '../../hooks/useIsDarkModePreferred.ts';

const DEFAULT_THEME_LIGHT = 'sap_horizon';
const DEFAULT_THEME_DARK = 'sap_horizon_dark';

export function resolveTheme(themeFromUrl: string | null, isDarkModePreferred: boolean): string {
  if (themeFromUrl) {
    return themeFromUrl;
  }
  return isDarkModePreferred ? DEFAULT_THEME_DARK : DEFAULT_THEME_LIGHT;
}

export function ThemeManager() {
  const isDarkModePreferred = useIsDarkModePreferred();
  const themeFromUrl = new URL(window.location.href).searchParams.get('sap-theme');

  useEffect(() => {
    const resolvedTheme = resolveTheme(themeFromUrl, isDarkModePreferred);
    void setTheme(resolvedTheme);
  }, [isDarkModePreferred, themeFromUrl]);

  return null;
}
