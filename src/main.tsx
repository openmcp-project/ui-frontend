import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import {
  BusyIndicator,
  ThemeProvider as UI5ThemeProvider,
} from '@ui5/webcomponents-react';
import { SWRConfig } from 'swr';
import { ToastProvider } from './context/ToastContext.tsx';
import { CopyButtonProvider } from './context/CopyButtonContext.tsx';
import { FrontendConfigProvider } from './context/FrontendConfigContext.tsx';
import '@ui5/webcomponents-react/dist/Assets'; //used for loading themes
import { DarkModeSystemSwitcher } from './components/Core/DarkModeSystemSwitcher.tsx';
import '.././i18n.ts';
import './utils/i18n/timeAgo';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import IllustratedError from './components/Shared/IllustratedError.tsx';
import { AuthProviderOnboarding } from './context/AuthProviderOnboarding.tsx';
import { ThemeProvider } from './@ui-components/ThemeProvider/ThemeProvider.tsx';

const ErrorFallback = ({ error }: FallbackProps) => {
  return <IllustratedError error={error} />;
};

const rootElement = document.getElementById('root');
const root = createRoot(rootElement!);

root.render(
  <React.StrictMode>
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => {}}>
      <Suspense fallback={<BusyIndicator active />}>
        <ThemeProvider>
          <FrontendConfigProvider>
            <AuthProviderOnboarding>
              <UI5ThemeProvider>
                <ToastProvider>
                  <CopyButtonProvider>
                    <SWRConfig
                      value={{
                        refreshInterval: 10000,
                      }}
                    >
                      <App />
                      <DarkModeSystemSwitcher />
                    </SWRConfig>
                  </CopyButtonProvider>
                </ToastProvider>
              </UI5ThemeProvider>
            </AuthProviderOnboarding>
          </FrontendConfigProvider>
        </ThemeProvider>
      </Suspense>
    </ErrorBoundary>
  </React.StrictMode>,
);
