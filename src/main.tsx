import { configureMonaco } from './lib/monaco.ts';
import React, { Suspense } from 'react';
import './index.css';
import App from './App';
import { BusyIndicator, ThemeProvider } from '@ui5/webcomponents-react';
import { SWRConfig } from 'swr';
import { ToastProvider } from './context/ToastContext.tsx';
import { CopyButtonProvider } from './context/CopyButtonContext.tsx';
import { FrontendConfigProvider } from './context/FrontendConfigContext.tsx';
import '@ui5/webcomponents-react/dist/Assets'; //used for loading themes
import { ThemeManager } from './components/ThemeManager.tsx';
import './utils/i18n/i18n.ts';
import './utils/i18n/timeAgo';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { ApolloClientProvider } from './spaces/onboarding/services/ApolloClientProvider/ApolloClientProvider.tsx';
import { IllustratedBanner } from './components/Ui/IllustratedBanner/IllustratedBanner.tsx';
import { useTranslation } from 'react-i18next';
import IllustrationMessageType from '@ui5/webcomponents-fiori/dist/types/IllustrationMessageType.js';
import { AuthProviderOnboarding } from './spaces/onboarding/auth/AuthContextOnboarding.tsx';
import { AuthCallbackHandler } from './common/auth/AuthCallbackHandler.tsx';

configureMonaco();

const ErrorFallback = ({ error }: FallbackProps) => {
  const { t } = useTranslation();

  return (
    <IllustratedBanner
      illustrationName={IllustrationMessageType.SimpleError}
      title={t('IllustratedError.titleText')}
      subtitle={error ? error : t('IllustratedError.subtitleText')}
    />
  );
};

export function createApp() {
  return (
    <React.StrictMode>
      <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => {}}>
        <Suspense fallback={<BusyIndicator active />}>
          <FrontendConfigProvider>
            <AuthCallbackHandler>
              <AuthProviderOnboarding>
                <ThemeProvider>
                  <ToastProvider>
                    <CopyButtonProvider>
                      <SWRConfig
                        value={{
                          refreshInterval: 10000,
                        }}
                      >
                        <ApolloClientProvider>
                          <App />
                        </ApolloClientProvider>
                        <ThemeManager />
                      </SWRConfig>
                    </CopyButtonProvider>
                  </ToastProvider>
                </ThemeProvider>
              </AuthProviderOnboarding>
            </AuthCallbackHandler>
          </FrontendConfigProvider>
        </Suspense>
      </ErrorBoundary>
    </React.StrictMode>
  );
}
