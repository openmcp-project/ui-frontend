import '@ui5/webcomponents-icons/dist/upload-to-cloud';
import '@ui5/webcomponents-icons/dist/database';
import '@ui5/webcomponents-icons/dist/cloud';
import { Icon, Tag } from '@ui5/webcomponents-react';
import { useTranslation } from 'react-i18next';
import { useYamlApply } from '../../context/YamlApplyContext.tsx';
import styles from './DragDropOverlay.module.css';

interface DragDropOverlayProps {
  onCancel: () => void;
}

export function DragDropOverlay({ onCancel }: DragDropOverlayProps) {
  const { t } = useTranslation();
  const { activeMcp } = useYamlApply();

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.relatedTarget === null) onCancel();
  };

  return (
    <div className={styles.backdrop} data-testid="drag-drop-overlay" onDragLeave={handleDragLeave}>
      <div className={styles.card}>
        <Icon name="upload-to-cloud" className={styles.icon} />
        <p className={styles.title}>{t('yamlApply.overlayTitle')}</p>
        {activeMcp ? (
          <Tag design="Positive">{t('yamlApply.overlayTargetCp', { name: activeMcp.name })}</Tag>
        ) : (
          <Tag design="Information">{t('yamlApply.overlayTargetOnboarding')}</Tag>
        )}
        <p className={styles.hint}>{t('yamlApply.overlayHint')}</p>
      </div>
    </div>
  );
}
