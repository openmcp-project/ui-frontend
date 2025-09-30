import { ControlPlaneType } from '../../../lib/api/types/crate/controlPlanes.ts';

import styles from './McpHeader.module.css';
import { formatDateAsTimeAgo } from '../../../utils/i18n/timeAgo.ts';
import { useTranslation } from 'react-i18next';
import { Button, Icon } from '@ui5/webcomponents-react';

export interface McpHeaderProps {
  mcp: ControlPlaneType;
}

export function McpHeader({ mcp }: McpHeaderProps) {
  const { t } = useTranslation();

  const created = new Date(mcp.metadata.creationTimestamp).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        <span className={styles.label}>{t('McpHeader.nameLabel')}</span>
        <span>{mcp.metadata.name}</span>

        <span className={styles.label}>{t('McpHeader.createdOnLabel')}</span>
        <span>
          {created} ({formatDateAsTimeAgo(mcp.metadata.creationTimestamp)})
        </span>

        <span className={styles.label}>{t('McpHeader.createdByLabel')}</span>
        <span>{mcp.metadata.annotations['openmcp.cloud/created-by']}</span>
      </div>
    </div>
  );
}
