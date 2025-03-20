import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ThemeProvider } from '@ui5/webcomponents-react';
import { AuthProvider } from 'react-oidc-context';
import { LoadCrateKubeConfig } from './lib/oidc/crate.ts';
import { SWRConfig } from 'swr';
import { ToastProvider } from './context/ToastContext.tsx';
import { CopyButtonProvider } from './context/CopyButtonContext.tsx';
import {
  FrontendConfigProvider,
  LoadFrontendConfig,
} from './context/FrontendConfigContext.tsx';
import '@ui5/webcomponents-react/dist/Assets'; //used for loading themes
import { DarkModeSystemSwitcher } from './components/Core/DarkModeSystemSwitcher.tsx';
import '.././i18n';
import './utils/i18n/timeAgo';
import { useTranslation } from 'react-i18next';

(async () => {
  try {
    const frontendConfig = await LoadFrontendConfig();
    const authconfig = await LoadCrateKubeConfig(frontendConfig.backendUrl);

    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <FrontendConfigProvider config={frontendConfig}>
          <AuthProvider key={'crate'} {...authconfig}>
            <ThemeProvider>
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
            </ThemeProvider>
          </AuthProvider>
        </FrontendConfigProvider>
      </React.StrictMode>,
    );
  } catch (e) {
    const { t } = useTranslation();
    console.error('failed to load frontend configuration or kubeconfig', e);
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <div>{t('main.failedMessage')}=</div>
      </React.StrictMode>,
    );
  }
})();
