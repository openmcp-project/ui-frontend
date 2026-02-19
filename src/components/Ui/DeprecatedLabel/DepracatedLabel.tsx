import { useTranslation } from 'react-i18next';

export const DeprecatedLabel = () => {
  const { t } = useTranslation();
  return <span>{t('common.depracated')}</span>;
};
