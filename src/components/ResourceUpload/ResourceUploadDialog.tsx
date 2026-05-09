import { useState, useCallback, useContext, useEffect } from 'react';
import {
  Dialog,
  Bar,
  Button,
  Label,
  Icon,
  MessageStrip,
} from '@ui5/webcomponents-react';
import { useTranslation } from 'react-i18next';
import { YamlEditor } from '../YamlEditor/YamlEditor';
import { ApiConfigContext } from '../Shared/k8s';
import { fetchApiServerJson } from '../../lib/api/fetch';
import { useResourcePluralNames } from '../../hooks/useResourcePluralNames';
import styles from './ResourceUploadDialog.module.css';

export interface ResourceUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (yaml: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  namespace?: string;
}

interface ValidationWarning {
  type: 'duplicate' | 'yaml-error';
  message: string;
}

export function ResourceUploadDialog({ isOpen, onClose, onSubmit, namespace }: ResourceUploadDialogProps) {
  const { t } = useTranslation();
  const [yamlContent, setYamlContent] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [validationWarning, setValidationWarning] = useState<ValidationWarning | null>(null);
  const apiConfig = useContext(ApiConfigContext);
  const { getPluralKind } = useResourcePluralNames();

  // Validate YAML and check for duplicates
  useEffect(() => {
    const validateYaml = async () => {
      if (!yamlContent.trim()) {
        setValidationWarning(null);
        return;
      }

      try {
        const yaml = await import('yaml');
        const parsed = yaml.parse(yamlContent);

        // Check if it's valid k8s resource
        if (!parsed?.kind || !parsed?.apiVersion || !parsed?.metadata?.name) {
          setValidationWarning({
            type: 'yaml-error',
            message: t('resourceUpload.validation.missingRequired'),
          });
          return;
        }

        // Check for duplicate resource
        const resourceName = parsed.metadata.name;
        const kind = parsed.kind;
        const apiVersion = parsed.apiVersion;
        const targetNamespace = namespace || parsed.metadata?.namespace;

        if (targetNamespace && kind && apiVersion) {
          try {
            const pluralKind = getPluralKind(kind);
            const path = `/apis/${apiVersion}/namespaces/${targetNamespace}/${pluralKind}/${resourceName}`;

            // Try to fetch the resource - if it exists, we'll get a response
            await fetchApiServerJson(path, apiConfig);

            // If we reach here, resource exists
            setValidationWarning({
              type: 'duplicate',
              message: t('resourceUpload.validation.resourceExists', { name: resourceName, kind }),
            });
          } catch (err) {
            // 404 means resource doesn't exist - that's good
            setValidationWarning(null);
          }
        }
      } catch (err) {
        setValidationWarning({
          type: 'yaml-error',
          message: t('resourceUpload.validation.invalidYaml'),
        });
      }
    };

    const debounce = setTimeout(validateYaml, 500);
    return () => clearTimeout(debounce);
  }, [yamlContent, namespace, apiConfig, getPluralKind, t]);

  const handleFileUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setYamlContent(content);
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
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
    setFeedback(null);
    setValidationWarning(null);
    setIsSubmitting(false);
    onClose();
  }, [onClose]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setYamlContent('');
      setFeedback(null);
      setValidationWarning(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  return (
    <Dialog
      open={isOpen}
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
                disabled={isSubmitting || !yamlContent.trim() || validationWarning?.type === 'yaml-error'}
              >
                {isSubmitting ? t('buttons.submitting') : t('buttons.create')}
              </Button>
            </>
          }
        />
      }
      className={styles.dialog}
    >
      <div
        className={styles.container}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {namespace && (
          <div className={styles.namespaceInfo}>
            <Label>{t('resourceUpload.controlPlaneNamespace')}:</Label>
            <span className={styles.namespace}>{namespace}</span>
          </div>
        )}

        <div className={styles.uploadHint}>
          <Icon name="upload" className={styles.uploadHintIcon} />
          <span className={styles.uploadHintText}>
            {t('resourceUpload.editorHint')}
          </span>
          <label className={styles.fileInputLabel}>
            <input
              type="file"
              accept=".yaml,.yml,text/yaml,text/x-yaml,application/x-yaml,text/plain"
              onChange={handleFileInputChange}
              className={styles.fileInput}
            />
            <Button icon="browse-folder" design="Transparent">
              {t('resourceUpload.browseFiles')}
            </Button>
          </label>
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

        {validationWarning && (
          <MessageStrip
            design={validationWarning.type === 'duplicate' ? 'Information' : 'Negative'}
            hideCloseButton
            className={styles.feedback}
          >
            {validationWarning.message}
          </MessageStrip>
        )}

        <div className={styles.editorContainer}>
          <YamlEditor
            value={yamlContent}
            onChange={(val) => setYamlContent(val || '')}
            isEdit={true}
            height="500px"
          />
        </div>

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
