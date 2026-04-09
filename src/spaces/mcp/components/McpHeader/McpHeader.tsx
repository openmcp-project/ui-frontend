import { Text } from '@ui5/webcomponents-react';
import { ControlPlaneType } from '../../../../lib/api/types/crate/controlPlanes.ts';
import { ManagedControlPlaneV2 } from '../../../onboarding/types/ControlPlane.ts';

import { useTranslation } from 'react-i18next';
import { formatDateAsTimeAgo } from '../../../../utils/i18n/timeAgo.ts';
import styles from './McpHeader.module.css';

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
