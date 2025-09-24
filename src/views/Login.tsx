import { useAuthOnboarding } from '../spaces/onboarding/auth/AuthContextOnboarding.tsx';
import { Button, Card, FlexBox, Link, Text } from '@ui5/webcomponents-react';
import ButtonDesign from '@ui5/webcomponents/dist/types/ButtonDesign.js';
import './login.css';
import { ThemingParameters } from '@ui5/webcomponents-react-base';
import { useLink } from '../lib/shared/useLink.ts';
import { useTranslation } from 'react-i18next';
import * as Sentry from '@sentry/react';
import { useEffect } from 'react';

export default function LoginView() {
  const auth = useAuthOnboarding();
  const { documentationHomepage } = useLink();
  const { t } = useTranslation();
  useEffect(() => {
    Sentry.addBreadcrumb({
      category: 'auth',
      message: 'Visit Login Page',
      level: 'info',
    });
  }, []);
  return (
    <FlexBox
      className="box"
      justifyContent="Center"
      alignItems="Center"
      direction="Column"
      style={{ backgroundColor: ThemingParameters.sapBackgroundColor }}
    >
      <Card style={{ width: 'fit-content' }}>
        <div style={{ margin: '1rem' }}>
          <img className="logo" src="/co-logo-orchestrating.png" alt="Logo" />
          <div className="headline">{t('Login.welcomeMessage')}</div>

          <Text className="description"> {t('Login.description')}</Text>

          <Text>
            <p>
              <Link href={documentationHomepage} target="_blank" rel="noreferrer">
                {t('Login.learnMore')}
              </Link>
            </p>
          </Text>
          <div>
            <Button design={ButtonDesign.Emphasized} onClick={() => void auth.login()}>
              {t('Login.signInButton')}
            </Button>
          </div>
        </div>
      </Card>
    </FlexBox>
  );
}
