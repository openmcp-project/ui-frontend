import { ControlPlaneType } from '../../../lib/api/types/crate/controlPlanes.ts';
import { Text } from '@ui5/webcomponents-react';

import styles from './McpHeader.module.css';
import { formatDateAsTimeAgo } from '../../../utils/i18n/timeAgo.ts';
import { useTranslation } from 'react-i18next';

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

  const createdBy = mcp.metadata.annotations?.['openmcp.cloud/created-by'];

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        <span className={styles.label}>{t('McpHeader.nameLabel')}</span>
        <Text>{mcp.metadata.name}</Text>

        <span className={styles.label}>{t('McpHeader.createdOnLabel')}</span>
        <Text>
          {created} ({formatDateAsTimeAgo(mcp.metadata.creationTimestamp)})
        </Text>

        {createdBy ? (
          <>
            <span className={styles.label}>{t('McpHeader.createdByLabel')}</span>
            <Text>{createdBy}</Text>
          </>
        ) : null}
      </div>
    </div>
  );
}
