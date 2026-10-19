import { Icon, Tag, Text, Title } from '@ui5/webcomponents-react';
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
      <div className={styles.card}>
        <Icon aria-hidden="true" className={styles.dropIcon} name="upload-to-cloud" />

        <Title className={styles.title} level="H3">
          {t('yamlApply.overlayTitle')}
        </Title>

        <div className={styles.targetBadge}>
          {activeMcp ? (
            <Tag design="Positive">{t('yamlApply.overlayTargetCp', { name: activeMcp.name })}</Tag>
          ) : (
            <Tag design="Information">{t('yamlApply.overlayTargetOnboarding')}</Tag>
          )}
        </div>

        <Text className={styles.hint}>{t('yamlApply.overlayHint')}</Text>
      </div>
    </div>
  );
}
