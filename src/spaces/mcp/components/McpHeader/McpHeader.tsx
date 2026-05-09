import { Text } from '@ui5/webcomponents-react';
import { ControlPlaneType } from '../../../../lib/api/types/crate/controlPlanes.ts';
import { ManagedControlPlaneV2 } from '../../../onboarding/types/ControlPlane.ts';

import { useTranslation } from 'react-i18next';
import { formatDateAsTimeAgo } from '../../../../utils/i18n/timeAgo.ts';
import styles from './McpHeader.module.css';
import { CopyButton } from '../../../../components/Shared/CopyButton.tsx';

export interface McpHeaderProps {
  mcp: ControlPlaneType | ManagedControlPlaneV2;
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
      <div className={styles.metadataCard}>
        <span className={styles.label}>{t('McpHeader.nameLabel')}</span>
        <div className={styles.nameContainer}>
          <Text className={styles.value}>
            <span className={styles.resourceName}>{mcp.metadata.name}</span>
          </Text>
          <CopyButton text={mcp.metadata.name} />
        </div>
      </div>

      <div className={styles.metadataCard}>
        <span className={styles.label}>{t('McpHeader.createdOnLabel')}</span>
        <Text className={styles.value}>{created}</Text>
        <Text className={styles.value} style={{ fontSize: '0.75rem', opacity: 0.7 }}>
          {formatDateAsTimeAgo(mcp.metadata.creationTimestamp)}
        </Text>
      </div>

      {createdBy && (
        <div className={styles.metadataCard}>
          <span className={styles.label}>{t('McpHeader.createdByLabel')}</span>
          <CopyButton text={createdBy} />
        </div>
      )}
    </div>
  );
}
