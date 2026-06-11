import { zodResolver } from '@hookform/resolvers/zod';
import { Bar, Button, Dialog, Option, Select, SelectDomRef, Title, Ui5CustomEvent } from '@ui5/webcomponents-react';
import ButtonDesign from '@ui5/webcomponents/dist/types/ButtonDesign.js';
import { useCallback, useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { stringify } from 'yaml';
import { YamlViewer } from '../../../../components/Yaml/YamlViewer.tsx';
import { useToast } from '../../../../context/ToastContext.tsx';
import { useManagedServicesQuery as _useManagedServicesQuery } from '../../hooks/useManagedServicesQuery.ts';
import styles from './ComponentInstallDialog.module.css';
import { createComponentInstallSchema, ComponentInstallFormValues } from './ComponentInstallDialog.schema.ts';

export interface UseCreateMutationResult {
  create: (variables: { namespace: string; object: unknown }) => Promise<unknown>;
  loading: boolean;
}

export interface UseUpdateMutationResult {
  update: (variables: { namespace: string; name: string; object: unknown }) => Promise<unknown>;
  loading: boolean;
}

export interface ComponentInstallDialogProps {
  open: boolean;
  onClose: () => void;
  mcpName: string;
  mcpNamespace: string;
  componentName: string;
  serviceName: string;
  mode?: 'install' | 'edit';
  initialVersion?: string;
  useCreateMutation: () => UseCreateMutationResult;
  useUpdateMutation: () => UseUpdateMutationResult;
  useManagedServicesQuery?: typeof _useManagedServicesQuery;
}

export function ComponentInstallDialog({
  open,
  onClose,
  mcpName,
  mcpNamespace,
  componentName,
  serviceName,
  mode = 'install',
  initialVersion,
  useCreateMutation,
  useUpdateMutation,
  useManagedServicesQuery = _useManagedServicesQuery,
}: ComponentInstallDialogProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const { services } = useManagedServicesQuery();
  const { create, loading: createLoading } = useCreateMutation();
  const { update, loading: updateLoading } = useUpdateMutation();
  const isLoading = createLoading || updateLoading;

  const service = useMemo(() => services.find((s) => s.name === serviceName), [services, serviceName]);
  const versions = useMemo(() => service?.versions ?? [], [service]);
  const apiVersion = service?.apiVersion ?? '';
  const kind = service?.kind ?? '';

  const schema = useMemo(() => createComponentInstallSchema(t), [t]);
  const {
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors, isSubmitted },
  } = useForm<ComponentInstallFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { version: '' },
  });

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && initialVersion) {
      reset({ version: initialVersion });
    } else {
      reset({ version: '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const version = useWatch({ control, name: 'version' });

  const handleVersionChange = useCallback(
    (e: Ui5CustomEvent<SelectDomRef, { selectedOption: HTMLElement }>) => {
      setValue('version', (e.detail.selectedOption as HTMLElement).getAttribute('value') ?? '', {
        shouldValidate: isSubmitted,
      });
    },
    [setValue, isSubmitted],
  );

  const onSubmit = useCallback(
    async (values: ComponentInstallFormValues) => {
      const object = {
        apiVersion,
        kind,
        metadata: { name: mcpName, namespace: mcpNamespace },
        spec: { version: values.version },
      };
      try {
        if (mode === 'edit') {
          await update({ namespace: mcpNamespace, name: mcpName, object });
        } else {
          await create({ namespace: mcpNamespace, object });
        }
        toast.show(
          mode === 'edit'
            ? t('ComponentInstallDialog.successMessageEdit', { component: componentName })
            : t('ComponentInstallDialog.successMessage', { component: componentName }),
        );
        handleClose();
      } catch (error) {
        console.error(`${componentName} mutation failed`, error);
        toast.show(
          mode === 'edit'
            ? t('ComponentInstallDialog.errorMessageEdit', { component: componentName })
            : t('ComponentInstallDialog.errorMessage', { component: componentName }),
        );
      }
    },
    [create, update, mode, mcpName, mcpNamespace, apiVersion, kind, componentName, t, toast, handleClose],
  );

  const handleApply = useCallback(() => {
    handleSubmit(onSubmit)();
  }, [handleSubmit, onSubmit]);

  const yamlPreview = useMemo(() => {
    const resource = {
      apiVersion,
      kind,
      metadata: { name: mcpName, namespace: mcpNamespace },
      spec: { version: version || `<${componentName.toLowerCase().replace(/\s+/g, '-')}-version>` },
    };
    return stringify(resource);
  }, [apiVersion, kind, version, mcpName, mcpNamespace, componentName]);

  return (
    <Dialog
      stretch={false}
      headerText={
        mode === 'edit'
          ? t('ComponentInstallDialog.titleEdit', { component: componentName })
          : t('ComponentInstallDialog.title', { component: componentName })
      }
      open={open}
      footer={
        <Bar
          design="Footer"
          endContent={
            <>
              <Button design={ButtonDesign.Emphasized} disabled={isLoading} onClick={handleApply}>
                {t('common.applyChanges')}
              </Button>
              <Button design={ButtonDesign.Transparent} onClick={handleClose}>
                {t('common.cancel')}
              </Button>
            </>
          }
        />
      }
      onClose={handleClose}
    >
      <div className={styles.content}>
        <div className={styles.formColumn}>
          <Title level="H5" className={styles.sectionTitle}>
            {t('ComponentInstallDialog.versionLabel', { component: componentName })}
          </Title>
          <Select
            data-cy="component-version-select"
            className={styles.versionSelect}
            accessibleName={t('ComponentInstallDialog.versionLabel', { component: componentName })}
            value={version}
            valueState={errors.version ? 'Negative' : 'None'}
            valueStateMessage={errors.version ? <span>{errors.version.message}</span> : undefined}
            onChange={handleVersionChange}
          >
            <Option value="">{t('ComponentsSelection.chooseVersion')}</Option>
            {versions.map(({ version: v }) => (
              <Option key={v} value={v}>
                {v}
              </Option>
            ))}
          </Select>
        </div>
        <div className={styles.yamlColumn}>
          <Title level="H5" className={styles.sectionTitle}>
            {t('ComponentInstallDialog.yamlPreview')}
          </Title>
          <div className={styles.yamlViewer}>
            <YamlViewer yamlString={yamlPreview} filename={mcpName} />
          </div>
        </div>
      </div>
    </Dialog>
  );
}
