import { Icon } from '@ui5/webcomponents-react';
import { useTranslation } from 'react-i18next';

import styles from './SupportInfoSection.module.css';

export function SupportInfoSectionHeader({ icon, label }: { icon: string; label: string }) {
  return (
    <div className={styles.header}>
      <Icon className={styles.headerIcon} name={icon} />
      {label}
    </div>
  );
}

export function SupportInfoField({
  label,
  value,
  indent = false,
}: {
  label: string;
  value?: string;
  indent?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className={indent ? styles.fieldIndent : styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <span className={value ? styles.fieldValue : styles.fieldEmpty}>{value || t('common.none')}</span>
    </div>
  );
}
