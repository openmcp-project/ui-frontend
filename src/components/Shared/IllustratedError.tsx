import '@ui5/webcomponents-fiori/dist/illustrations/SimpleError';
import { useTranslation } from 'react-i18next';
import { IllustratedBanner } from '../Ui/IllustratedBanner/IllustratedBanner';
import { IllustrationName } from './IllustratedName';

interface Props {
  title?: string;
  subtitleText?: string;
  error?: string;
}

export default function IllustratedError({
  title,
  subtitleText,
  error,
}: Props) {
  const { t } = useTranslation();

  return (
    <IllustratedBanner
      illustrationName={IllustrationName.SimpleError}
      title={title ?? t('IllustratedError.titleText')}
      subtitle={error ?? subtitleText ?? t('IllustratedError.subtitleText')}
    />
  );
}
