import { IllustratedMessage } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-fiori/dist/illustrations/ReloadScreen';
import { useTranslation } from 'react-i18next';

export default function Loading() {
  const { t } = useTranslation();

  return (
    <>
      <IllustratedMessage name="ReloadScreen" titleText={t('Loading.title')} subtitleText={t('Loading.subtitle')} />
    </>
  );
}
