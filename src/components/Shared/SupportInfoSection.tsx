import { Icon, Tag } from '@ui5/webcomponents-react';
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

/**
 * Renders a comma-separated string as a wrapping row of read-only Tag
 * chips. Same "n/a" fallback as SupportInfoField so an empty value stays
 * visually consistent with scalar rows.
 */
export function SupportInfoListField({
  label,
  value,
  indent = false,
}: {
  label: string;
  value?: string;
  indent?: boolean;
}) {
  const { t } = useTranslation();
  const items = (value ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return (
    <div className={indent ? styles.fieldIndent : styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      {items.length === 0 ? (
        <span className={styles.fieldEmpty}>{t('common.none')}</span>
      ) : (
        <div className={styles.tagList}>
          {items.map((item) => (
            <Tag key={item} design="Neutral" hideStateIcon>
              {item}
            </Tag>
          ))}
        </div>
      )}
    </div>
  );
}
