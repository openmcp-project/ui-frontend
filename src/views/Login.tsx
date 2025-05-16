import { useAuth } from 'react-oidc-context';
import { Button, Card, FlexBox, Text } from '@ui5/webcomponents-react';
import ButtonDesign from '@ui5/webcomponents/dist/types/ButtonDesign.js';
import './login.css';
import { ThemingParameters } from '@ui5/webcomponents-react-base';
import { useLink } from '../lib/shared/useLink.ts';
import { useTranslation } from 'react-i18next';

export default function LoginView() {
  const auth = useAuth();
  const { documentationHomepage } = useLink();
  const { t } = useTranslation();

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
          <Text>{t('Login.description')}</Text>
          <Text>
            <p>
              <a href={documentationHomepage} target="_blank" rel="noreferrer">
                {t('Login.learnMore')}
              </a>
            </p>
          </Text>
          <div>
            <Button
              design={ButtonDesign.Emphasized}
              onClick={() => void auth.signinRedirect()}
            >
              {t('Login.signInButton')}
            </Button>
          </div>
        </div>
      </Card>
    </FlexBox>
  );
}
