import { IllustratedMessage } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-fiori/dist/illustrations/PageNotFound';
// thorws error sometimes if not imported
import '@ui5/webcomponents-fiori/dist/illustrations/BeforeSearch';
import Delayed from '../Helper/Delayed.tsx';
import { useTranslation } from 'react-i18next';
import { useFrontendConfig } from '../../context/FrontendConfigContext.tsx';

export default function NotInLuigiView() {
  const { t } = useTranslation();
  const { branding } = useFrontendConfig();

  return (
    <Delayed waitBeforeShow={2000}>
      <IllustratedMessage
        name="PageNotFound"
        titleText={t('NotInLuigiView.titleMessage', { portalName: branding.portalName })}
        subtitleText={t('NotInLuigiView.subtitleMessage', { portalName: branding.portalName })}
      />
    </Delayed>
  );
}
