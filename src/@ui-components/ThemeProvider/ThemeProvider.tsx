import { ReactNode } from 'react';

import './theme.css';
import './font-face.css';
import './ui5-compatibility.css';

export interface ThemeProviderProps {
  children?: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return <>{children}</>;
}
