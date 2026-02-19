import { useTranslation } from 'react-i18next';
import styles from './DeprecatedLabel.module.css';
export const DeprecatedLabel = () => {
  const { t } = useTranslation();
  return <span className={styles.label}>{t('common.deprecated')}</span>;
};
