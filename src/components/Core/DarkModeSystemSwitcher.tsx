import { useEffect } from "react";
import { setTheme } from "@ui5/webcomponents-base/dist/config/Theme.js";


export function DarkModeSystemSwitcher() {
  if (window.matchMedia) {
    useEffect(() => {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => setTheme(e.matches ? 'sap_horizon_dark' : 'sap_horizon'));

      const initialMode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'sap_horizon_dark' : 'sap_horizon';
      setTheme(initialMode);

      return () => {
        window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', () => { });
      }
    }, []);
  } else {
    console.warn('Dark mode system switcher is not supported in this browser');
  }

  return (<></>)
}