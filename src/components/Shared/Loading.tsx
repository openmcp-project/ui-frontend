import { IllustratedMessage } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-fiori/dist/illustrations/ReloadScreen';
import { useTranslation } from 'react-i18next';

interface Props {
  title?: string;
  subtitle?: string;
}

export default function Loading({ title, subtitle }: Props) {
  const { t } = useTranslation();

  return (
    <>
      <IllustratedMessage
        name="ReloadScreen"
        titleText={title ?? t('Loading.title')}
        subtitleText={subtitle ?? t('Loading.subtitle')}
      />
    </>
  );
}
