import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import * as Sentry from '@sentry/react';

import { Button, Card, FlexBox, Text, Title } from '@ui5/webcomponents-react';
import ButtonDesign from '@ui5/webcomponents/dist/types/ButtonDesign.js';

import { useAuthOnboarding as _useAuthOnboarding } from '../../auth/AuthContextOnboarding';
import { useLink as _useLink } from '../../../../lib/shared/useLink';
import { useTheme } from '../../../../hooks/useTheme';

import LogoLight from '../../../../assets/images/co-logo-orchestrating.png';
import LogoDark from '../../../../assets/images/co-logo-orchestrating-dark.png';

import styles from './SignInPage.module.css';

export interface SignInPageProps {
  useAuthOnboarding?: typeof _useAuthOnboarding;
  useLink?: typeof _useLink;
}
export function SignInPage({ useAuthOnboarding = _useAuthOnboarding, useLink = _useLink }: SignInPageProps) {
  const { login } = useAuthOnboarding();
  const { documentationHomepage } = useLink();
  const { t } = useTranslation();
  const { isDarkTheme } = useTheme();

  useEffect(() => {
    Sentry.addBreadcrumb({
      category: 'auth',
      message: 'Visit SignInPage',
      level: 'info',
    });
  }, []);
  return (
    <FlexBox className={styles.container} justifyContent="Center" alignItems="Center" direction="Column">
      <FlexBox direction="Column" gap="1em">
        <Card>
          <FlexBox alignItems="Center" direction="Column" className={styles.cardContent}>
            <Title level="H1" size="H2" className={styles.heading}>
              {t('SignInPage.welcomeMessage')}
            </Title>

            <Text className={styles.description}> {t('SignInPage.subtitle')}</Text>

            <img className={styles.logo} src={isDarkTheme ? LogoDark : LogoLight} alt="" />

            <FlexBox direction="Column" alignItems="Center" gap="1em">
              <Button design={ButtonDesign.Emphasized} onClick={() => void login()}>
                {t('SignInPage.signInButton')}
              </Button>
            </FlexBox>
          </FlexBox>
        </Card>
        <FlexBox justifyContent="End">
          <a href={documentationHomepage} target="_blank" rel="noreferrer">
            <Button tabIndex={-1} design="Transparent">
              {t('SignInPage.learnMoreLink')}
            </Button>
          </a>
        </FlexBox>
      </FlexBox>
    </FlexBox>
  );
}
