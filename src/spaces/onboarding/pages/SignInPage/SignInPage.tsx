import * as Sentry from '@sentry/react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@ui5/webcomponents-react';
import ButtonDesign from '@ui5/webcomponents/dist/types/ButtonDesign.js';

import { useLink as _useLink } from '../../../../lib/shared/useLink';
import { useAuthOnboarding as _useAuthOnboarding } from '../../auth/AuthContextOnboarding';

import ocpLogo from '../../../../assets/images/co-logo-orchestrating.png';
import bmwkEu from '../../../../assets/images/splash/BMWK-EU.png';

import styles from './SignInPage.module.css';

export interface SignInPageProps {
  useAuthOnboarding?: typeof _useAuthOnboarding;
  useLink?: typeof _useLink;
}

export function SignInPage({ useAuthOnboarding = _useAuthOnboarding, useLink = _useLink }: SignInPageProps) {
  const { login } = useAuthOnboarding();
  const { contributeLink } = useLink();
  const { t } = useTranslation();

  useEffect(() => {
    Sentry.addBreadcrumb({
      category: 'auth',
      message: 'Visit SignInPage',
      level: 'info',
    });
  }, []);

  return (
    <div className={styles.container}>
      <div> </div>
      <div className={styles.heroSection}>
        <img src={ocpLogo} alt="Open Control Plane" className={styles.heroImage} />

        <p className={styles.welcomeMessage}>{t('SignInPage.welcomeMessage')}</p>
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

      <div className={styles.disclaimer}>
        <img src={bmwkEu} alt="Funded by BMWK and EU" className={styles.disclaimerImage} />
      </div>
    </div>
  );
}
