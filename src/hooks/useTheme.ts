import { useSyncExternalStore } from 'react';
import { Theme } from '@ui5/webcomponents-react';

const DEFAULT_THEME_LIGHT = Theme.sap_horizon;
const DEFAULT_THEME_DARK = Theme.sap_horizon_dark;
const DARK_SAP_THEMES = new Set<string>([
  Theme.sap_fiori_3_dark,
  Theme.sap_fiori_3_hcb,
  Theme.sap_horizon_dark,
  Theme.sap_horizon_hcb,
]);

function useSystemDarkModePreference() {
  return useSyncExternalStore(
    (callback) => {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', callback);
      return () => mediaQuery.removeEventListener('change', callback);
    },
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
  );
}

export function useTheme() {
  const systemPrefersDark = useSystemDarkModePreference();
  const themeFromUrl = new URL(window.location.href).searchParams.get('sap-theme');

  // Theme from URL takes precedence over system settings
  const theme = themeFromUrl || (systemPrefersDark ? DEFAULT_THEME_DARK : DEFAULT_THEME_LIGHT);

  // For well-defined SAP themes, return if they are light or dark – unknown themes will fall back to light
  const isDarkTheme = DARK_SAP_THEMES.has(theme);

  return {
    theme,
    isDarkTheme,
  };
}
