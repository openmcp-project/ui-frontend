import { useEffect } from 'react';
import { setTheme } from '@ui5/webcomponents-base/dist/config/Theme.js';

export function DarkModeSystemSwitcher() {
  useEffect(() => {
    if (!window.matchMedia) {
      console.warn(
        'Dark mode system switcher is not supported in this browser',
      );
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? 'sap_horizon_dark' : 'sap_horizon');
    };

    mediaQuery.addEventListener('change', handleChange);

    const initialMode = mediaQuery.matches ? 'sap_horizon_dark' : 'sap_horizon';
    setTheme(initialMode);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return null; // albo <></>
}
