import * as Sentry from '@sentry/react';
import IllustrationMessageType from '@ui5/webcomponents-fiori/dist/types/IllustrationMessageType.js';
import { BusyIndicator, ThemeProvider } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-react/dist/Assets'; //used for loading themes
import React, { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { SWRConfig } from 'swr';
import App from './App';
import { AuthCallbackHandler } from './common/auth/AuthCallbackHandler.tsx';
import { ThemeManager } from './components/ThemeManager.tsx';
import { IllustratedBanner } from './components/Ui/IllustratedBanner/IllustratedBanner.tsx';
import { CopyButtonProvider } from './context/CopyButtonContext.tsx';
import { FrontendConfigProvider } from './context/FrontendConfigContext.tsx';
import { ToastProvider } from './context/ToastContext.tsx';
import './index.css';
import { configureMonaco } from './lib/monaco.ts';
import { AuthProviderOnboarding } from './spaces/onboarding/auth/AuthContextOnboarding.tsx';
import { ApolloClientProvider } from './spaces/onboarding/services/ApolloClientProvider/ApolloClientProvider.tsx';
import './utils/i18n/i18n.ts';
import './utils/i18n/timeAgo';

configureMonaco();

interface SentryErrorFallbackProps {
  error: Error;
  componentStack: string | null;
  resetError: () => void;
}

const ErrorFallback = ({ error }: SentryErrorFallbackProps) => {
  const { t } = useTranslation();

  return (
    <div>
      <IllustratedBanner
        illustrationName={IllustrationMessageType.SimpleError}
        title={t('IllustratedError.titleText')}
        subtitle={error?.message || t('IllustratedError.subtitleText')}
      />
    </div>
  );
};

export function createApp() {
  return (
    <React.StrictMode>
      <Sentry.ErrorBoundary
        fallback={({ error, componentStack, resetError }) => (
          <ErrorFallback error={error as Error} componentStack={componentStack} resetError={resetError} />
        )}
      >
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
      </Sentry.ErrorBoundary>
    </React.StrictMode>
  );
}
