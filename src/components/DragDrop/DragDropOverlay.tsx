import '@ui5/webcomponents-icons/dist/cloud';
import '@ui5/webcomponents-icons/dist/org-chart';
import '@ui5/webcomponents-icons/dist/upload-to-cloud';
import { Icon, ObjectStatus, Text, Title } from '@ui5/webcomponents-react';
import { useTranslation } from 'react-i18next';
import { useYamlApply } from '../../context/YamlApplyContext';
import styles from './DragDropOverlay.module.css';

interface Props {
  onCancel: () => void;
}

export function DragDropOverlay({ onCancel }: Props) {
  const { activeMcp } = useYamlApply();
  const { t } = useTranslation();

  return (
    <div
      className={styles.backdrop}
      onDragLeave={(e) => {
        if (e.relatedTarget === null) onCancel();
      }}
    >
      {/* Decorative drop frame, inset from the viewport edges. */}
      <div aria-hidden="true" className={styles.frame} />

      <div className={styles.card} role="status">
        <div aria-hidden="true" className={styles.iconBadge}>
          <Icon className={styles.dropIcon} name="upload-to-cloud" />
        </div>

        <Title className={styles.title} level="H4">
          {t('yamlApply.overlayTitle')}
        </Title>

        {/* Same target indicator as the apply dialog, so both surfaces share one visual language. */}
        <ObjectStatus
          icon={<Icon name={activeMcp ? 'cloud' : 'org-chart'} />}
          inverted
          state={activeMcp ? 'Positive' : 'Information'}
        >
          {activeMcp
            ? t('yamlApply.overlayTargetCp', { name: activeMcp.name })
            : t('yamlApply.overlayTargetOnboarding')}
        </ObjectStatus>

        <Text className={styles.hint}>{t('yamlApply.overlayHint')}</Text>
      </div>
    </div>
  );
}
