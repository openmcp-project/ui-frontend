import * as Sentry from '@sentry/react';
import { useEffect } from 'react';
import type React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@ui5/webcomponents-react';
import ButtonDesign from '@ui5/webcomponents/dist/types/ButtonDesign.js';

import { OpenControlPlaneIcon } from '../../../../components/Core/OpenControlPlaneIcon';
import fundingLogo from '../../../../assets/images/funding-logo.png';
import { useLink as _useLink } from '../../../../lib/shared/useLink';
import { useTelemetry as _useTelemetry } from '../../../../lib/telemetry/telemetry';
import { SIGN_IN_PAGE } from '../../../../lib/telemetry/pageView/virtualPage';
import { useAuthOnboarding as _useAuthOnboarding } from '../../auth/AuthContextOnboarding';
import { useFrontendConfig } from '../../../../context/FrontendConfigContext';

import styles from './SignInPage.module.css';

export interface SignInPageProps {
  useAuthOnboarding?: typeof _useAuthOnboarding;
  useLink?: typeof _useLink;
  useTelemetry?: typeof _useTelemetry;
}

export function SignInPage({
  useAuthOnboarding = _useAuthOnboarding,
  useLink = _useLink,
  useTelemetry = _useTelemetry,
}: SignInPageProps) {
  const { login } = useAuthOnboarding();
  const { contributeLink } = useLink();
  const { t } = useTranslation();
  const { branding } = useFrontendConfig();
  const telemetry = useTelemetry();

  const primaryColorStyle = branding.primaryColor
    ? ({ '--ocp-primary': branding.primaryColor } as React.CSSProperties)
    : undefined;

  useEffect(() => {
    Sentry.addBreadcrumb({
      category: 'auth',
      message: 'Visit SignInPage',
      level: 'info',
    });
    telemetry.pageView(SIGN_IN_PAGE);
  }, [telemetry]);

  return (
    <div className={styles.container}>
      <div> </div>
      <div className={styles.heroSection}>
        <OpenControlPlaneIcon alt={branding.appName} className={styles.heroImage} />

        <p className={styles.welcomeMessage} style={primaryColorStyle}>
          <Trans
            components={{ appName: <span className={styles.appName} /> }}
            i18nKey="SignInPage.welcomeMessage"
            values={{ appName: branding.appName }}
          />
        </p>
        <p className={styles.subtitle}>{t('SignInPage.subtitle')}</p>

        <div className={styles.actionContainer}>
          <Button className={styles.signInButton} design={ButtonDesign.Emphasized} onClick={() => void login()}>
            {t('SignInPage.signInButton')}
          </Button>
          <a href={contributeLink} target="_blank" rel="noreferrer" className={styles.contributorLink}>
            {t('SignInPage.becomeContributorLink')}
          </a>
        </div>
      </div>

      {branding.showFundingLogo && (
        <div className={styles.disclaimer}>
          <img src={fundingLogo} alt="Funded by BMWK and EU" className={styles.disclaimerImage} />
        </div>
      )}
    </div>
  );
}
