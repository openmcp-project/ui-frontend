import { useState, useCallback } from 'react';
import {
  Dialog,
  Bar,
  Button,
  Label,
  Icon,
  MessageStrip,
  SegmentedButton,
  SegmentedButtonItem,
} from '@ui5/webcomponents-react';
import { useTranslation } from 'react-i18next';
import { YamlEditor } from '../YamlEditor/YamlEditor';
import styles from './ResourceUploadDialog.module.css';

export interface ResourceUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (yaml: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  namespace?: string;
}

type EditorMode = 'editor' | 'upload';

export function ResourceUploadDialog({ isOpen, onClose, onSubmit, namespace }: ResourceUploadDialogProps) {
  const { t } = useTranslation();
  const [yamlContent, setYamlContent] = useState<string>('');
  const [mode, setMode] = useState<EditorMode>('editor');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setYamlContent(content);
      setMode('editor');
      setFeedback(null);
    };
    reader.onerror = () => {
      setFeedback({
        type: 'error',
        message: t('resourceUpload.fileReadError'),
      });
    };
    reader.readAsText(file);
  }, [t]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      // Check if it's a text file or yaml
      if (file.type === 'text/yaml' || file.type === 'text/x-yaml' || file.type === 'application/x-yaml' ||
          file.name.endsWith('.yaml') || file.name.endsWith('.yml') || file.type === 'text/plain') {
        handleFileUpload(file);
      } else {
        setFeedback({
          type: 'error',
          message: t('resourceUpload.invalidFileType'),
        });
      }
    }
  }, [handleFileUpload, t]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!yamlContent.trim()) {
      setFeedback({
        type: 'error',
        message: t('resourceUpload.emptyContent'),
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const result = await onSubmit(yamlContent);

      if (result.success) {
        setFeedback({
          type: 'success',
          message: result.message || t('resourceUpload.success'),
        });
        // Reset after success
        setTimeout(() => {
          setYamlContent('');
          setFeedback(null);
          onClose();
        }, 2000);
      } else {
        setFeedback({
          type: 'error',
          message: result.error || t('resourceUpload.failed'),
        });
      }
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : t('resourceUpload.unknownError'),
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [yamlContent, onSubmit, onClose, t]);

  const handleClose = useCallback(() => {
    setYamlContent('');
    setMode('editor');
    setFeedback(null);
    setIsSubmitting(false);
    onClose();
  }, [onClose]);

  return (
    <Dialog
      open={isOpen}
      onAfterClose={handleClose}
      headerText={t('resourceUpload.title')}
      footer={
        <Bar
          endContent={
            <>
              <Button onClick={handleClose} disabled={isSubmitting}>
                {t('buttons.cancel')}
              </Button>
              <Button
                design="Emphasized"
                onClick={handleSubmit}
                disabled={isSubmitting || !yamlContent.trim()}
              >
                {isSubmitting ? t('buttons.submitting') : t('buttons.create')}
              </Button>
            </>
          }
        />
      }
      className={styles.dialog}
    >
      <div className={styles.container}>
        {namespace && (
          <div className={styles.namespaceInfo}>
            <Label>{t('resourceUpload.targetNamespace')}:</Label>
            <span className={styles.namespace}>{namespace}</span>
          </div>
        )}

        <div className={styles.modeSelector}>
          <SegmentedButton
            onSelectionChange={(e) => setMode(e.detail.selectedItem.dataset.mode as EditorMode)}
          >
            <SegmentedButtonItem data-mode="editor" pressed={mode === 'editor'}>
              <Icon name="syntax" />
              {t('resourceUpload.yamlEditor')}
            </SegmentedButtonItem>
            <SegmentedButtonItem data-mode="upload" pressed={mode === 'upload'}>
              <Icon name="upload" />
              {t('resourceUpload.uploadFile')}
            </SegmentedButtonItem>
          </SegmentedButton>
        </div>

        {feedback && (
          <MessageStrip
            design={feedback.type === 'success' ? 'Positive' : 'Negative'}
            hideCloseButton
            className={styles.feedback}
          >
            {feedback.message}
          </MessageStrip>
        )}

        {mode === 'editor' ? (
          <div className={styles.editorContainer}>
            <YamlEditor
              value={yamlContent}
              onChange={(val) => setYamlContent(val)}
              isEdit={true}
              height="500px"
            />
          </div>
        ) : (
          <div
            className={`${styles.uploadZone} ${isDragging ? styles.dragging : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Icon name="upload-to-cloud" className={styles.uploadIcon} />
            <p className={styles.uploadText}>
              {t('resourceUpload.dragDropText')}
            </p>
            <p className={styles.uploadSubtext}>
              {t('resourceUpload.or')}
            </p>
            <label className={styles.fileInputLabel}>
              <input
                type="file"
                accept=".yaml,.yml,text/yaml,text/x-yaml,application/x-yaml,text/plain"
                onChange={handleFileInputChange}
                className={styles.fileInput}
              />
              <Button icon="upload">
                {t('resourceUpload.browseFiles')}
              </Button>
            </label>
          </div>
        )}

        <div className={styles.crdSection}>
          <Button
            icon="document"
            disabled
            tooltip={t('resourceUpload.crdComingSoon')}
          >
            {t('resourceUpload.createFromCRD')}
          </Button>
          <span className={styles.crdHint}>
            {t('resourceUpload.crdHint')}
          </span>
        </div>
      </div>
    </Dialog>
  );
}
