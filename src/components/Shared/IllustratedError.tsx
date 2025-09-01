import '@ui5/webcomponents-fiori/dist/illustrations/SimpleError';
import { useTranslation } from 'react-i18next';
import { IllustratedBanner } from '../Ui/IllustratedBanner/IllustratedBanner';
import IllustrationMessageType from '@ui5/webcomponents-fiori/dist/types/IllustrationMessageType.js';

interface Props {
  title?: string;
  details?: string;
  compact?: boolean;
}

export default function IllustratedError({ title, details, compact }: Props) {
  const { t } = useTranslation();

  return (
    <IllustratedBanner
      illustrationName={IllustrationMessageType.SimpleError}
      title={title ?? t('IllustratedError.titleText')}
      subtitle={details ?? t('IllustratedError.subtitleText')}
      compact={compact}
    />
  );
}
