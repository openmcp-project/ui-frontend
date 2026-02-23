import { configureMonaco } from './lib/monaco.ts';
import React, { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { SWRConfig } from 'swr';
import App from './App';
import { AuthCallbackHandler } from './common/auth/AuthCallbackHandler.tsx';
import { ThemeManager } from './components/ThemeManager.tsx';
import { IllustratedBanner } from './components/Ui/IllustratedBanner/IllustratedBanner.tsx';

import { Infobox } from './components/Ui/Infobox/Infobox.tsx';
import { CopyButtonProvider } from './context/CopyButtonContext.tsx';
import { FeatureToggleProvider } from './context/FeatureToggleContext.tsx';
import { FrontendConfigProvider } from './context/FrontendConfigContext.tsx';
import { ToastProvider } from './context/ToastContext.tsx';
import './index.css';
import { AuthProviderOnboarding } from './spaces/onboarding/auth/AuthContextOnboarding.tsx';
import { ApolloClientProvider } from './spaces/onboarding/services/ApolloClientProvider/ApolloClientProvider.tsx';
import './utils/i18n/i18n.ts';
import './utils/i18n/timeAgo';

configureMonaco();

interface SentryErrorFallbackProps {
  error: Error;
  componentStack: string | null;
}

const ErrorFallback = ({ error, componentStack }: SentryErrorFallbackProps) => {
  const { t } = useTranslation();

  return (
    <div className="error-message">
      <div>
        <IllustratedBanner
          illustrationName={IllustrationMessageType.SimpleError}
          title={t('IllustratedError.titleText')}
          subtitle={error?.message || t('IllustratedError.subtitleText')}
        />
      </div>
      <div>
        <Infobox className="infobox" size="sm">
          <pre>{error.toString()}</pre>
          <pre>{componentStack}</pre>
        </Infobox>
      </div>
    </div>
  );
};

export function createApp() {
  return (
    <React.StrictMode>
      <Sentry.ErrorBoundary
        fallback={({ error, componentStack }) => (
          <ErrorFallback error={error as Error} componentStack={componentStack} />
        )}
      >
        <Suspense fallback={<BusyIndicator active />}>
          <FrontendConfigProvider>
            <FeatureToggleProvider>
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
            </FeatureToggleProvider>
          </FrontendConfigProvider>
        </Suspense>
      </Sentry.ErrorBoundary>
    </React.StrictMode>
  );
}
