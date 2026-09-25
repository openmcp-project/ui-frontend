import { Tag } from '@ui5/webcomponents-react';
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
        <div className={styles.dropIcon} aria-hidden="true">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5v-9m0 9-3-3m3 3 3-3" />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 9.75A2.25 2.25 0 016 7.5h.5a1 1 0 001-1V6a4 4 0 018 0v.5a1 1 0 001 1H17a2.25 2.25 0 012.25 2.25v6.5a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25v-6.5z"
            />
          </svg>
        </div>

        <p className={styles.title}>{t('yamlApply.overlayTitle')}</p>

        <div className={styles.targetBadge}>
          {activeMcp ? (
            <Tag design="Positive" className={styles.tag}>
              {t('yamlApply.overlayTargetCp', { name: activeMcp.name })}
            </Tag>
          ) : (
            <Tag design="Information" className={styles.tag}>
              {t('yamlApply.overlayTargetOnboarding')}
            </Tag>
          )}
        </div>

        <p className={styles.hint}>{t('yamlApply.overlayHint')}</p>
      </div>
    </div>
  );
}
