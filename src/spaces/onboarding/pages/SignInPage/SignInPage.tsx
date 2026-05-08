import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import * as Sentry from '@sentry/react';

import { Button } from '@ui5/webcomponents-react';
import ButtonDesign from '@ui5/webcomponents/dist/types/ButtonDesign.js';

import { useAuthOnboarding as _useAuthOnboarding } from '../../auth/AuthContextOnboarding';
import { useLink as _useLink } from '../../../../lib/shared/useLink';
import { ControlPlane1, ControlPlane2, ControlPlane3, ControlPlane4 } from './components/ControlPlanes';

import cp1 from '../../../../assets/images/splash/cp1.png';
import cp2 from '../../../../assets/images/splash/cp2.png';
import cp3 from '../../../../assets/images/splash/cp3.png';
import cp4 from '../../../../assets/images/splash/cp4.png';
import logo from '../../../../assets/images/splash/logo.png';
import bmwkEu from '../../../../assets/images/splash/BMWK-EU.png';

import styles from './SignInPage.module.css';

export interface SignInPageProps {
  useAuthOnboarding?: typeof _useAuthOnboarding;
  useLink?: typeof _useLink;
}

export function SignInPage({ useAuthOnboarding = _useAuthOnboarding, useLink = _useLink }: SignInPageProps) {
  const { login } = useAuthOnboarding();
  const { documentationHomepage } = useLink();
  const { t } = useTranslation();

  useEffect(() => {
    Sentry.addBreadcrumb({
      category: 'auth',
      message: 'Visit SignInPage',
      level: 'info',
    });
  }, []);

  useEffect(() => {
    const controlPlanes = document.querySelectorAll(`.${styles.controlPlane}`);
    const clouds = document.querySelectorAll(`.${styles.cloudProjection}`);

    controlPlanes.forEach((cp) => cp.classList.add(styles.visible));
    clouds.forEach((cloud) => cloud.classList.add(styles.visible));
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.controlPlanesContainer}>
        <ControlPlane1 image={cp1} className={styles.plane1} />
        <ControlPlane2 image={cp2} className={styles.plane2} />
        <ControlPlane3 image={cp3} className={styles.plane3} />
        <ControlPlane4 image={cp4} className={styles.plane4} />
      </div>

      <div className={styles.content}>
        <div className={styles.heroSection}>
          <img src={logo} alt="Open Control Plane" className={styles.logo} />
          <p className={styles.tagline}>{t('SignInPage.tagline')}</p>
          <p className={styles.hashtags}>{t('SignInPage.hashtags')}</p>

          <div className={styles.actionContainer}>
            <Button className={styles.signInButton} design={ButtonDesign.Emphasized} onClick={() => void login()}>
              {t('SignInPage.signInButton')}
            </Button>
          </div>

          <div className={styles.linksContainer}>
            <a href={documentationHomepage} target="_blank" rel="noreferrer" className={styles.docsLink}>
              {t('SignInPage.learnMoreLink')}
            </a>
            <a href="https://github.com/openmcp-project" target="_blank" rel="noreferrer" className={styles.docsLink}>
              {t('SignInPage.contributeLink')}
            </a>
          </div>
        </div>
      </div>

      <div className={styles.disclaimer}>
        <img src={bmwkEu} alt="Funded by BMWK and EU" className={styles.disclaimerImage} />
      </div>
    </div>
  );
}
