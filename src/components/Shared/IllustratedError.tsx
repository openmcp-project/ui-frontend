import { IllustratedMessage } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-fiori/dist/illustrations/SimpleError';
import IllustrationMessageDesign from '@ui5/webcomponents-fiori/dist/types/IllustrationMessageDesign.js';
import { useTranslation } from 'react-i18next';

interface Props {
  title?: string;
  subtitleText?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error?: any;
}

export default function IllustratedError({
  title,
  subtitleText,
  error,
}: Props) {
  const { t } = useTranslation();

  return (
    <IllustratedMessage
      name="SimpleError"
      design={IllustrationMessageDesign.Spot}
      titleText={title ?? t('IllustratedError.titleText')}
      subtitleText={error ?? subtitleText ?? t('IllustratedError.subtitleText')}
    />
  );
}
