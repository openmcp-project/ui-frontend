import { zodResolver } from '@hookform/resolvers/zod';
import {
  Bar,
  Button,
  CheckBox,
  CheckBoxDomRef,
  Dialog,
  FlexBox,
  Option,
  Select,
  SelectDomRef,
  Title,
  Ui5CustomEvent,
} from '@ui5/webcomponents-react';
import ButtonDesign from '@ui5/webcomponents/dist/types/ButtonDesign.js';
import { useCallback, useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { stringify } from 'yaml';
import { YamlViewer } from '../../../../components/Yaml/YamlViewer.tsx';
import { useToast } from '../../../../context/ToastContext.tsx';
import { useCreateCrossplane as _useCreateCrossplane } from '../../hooks/useCreateCrossplane.ts';
import { useManagedServicesQuery as _useManagedServicesQuery } from '../../hooks/useManagedServicesQuery.ts';
import { useUpdateCrossplane as _useUpdateCrossplane } from '../../hooks/useUpdateCrossplane.ts';
import type { CrossplaneData } from '../../types/Crossplane.ts';
import styles from './CrossplaneInstallDialog.module.css';
import { createCrossplaneInstallSchema, CrossplaneInstallFormValues } from './CrossplaneInstallDialog.schema.ts';

interface CrossplaneInstallDialogProps {
  open: boolean;
  onClose: () => void;
  mcpName: string;
  mcpNamespace: string;
  mode?: 'install' | 'edit';
  initialData?: CrossplaneData;
  useCreateCrossplane?: typeof _useCreateCrossplane;
  useUpdateCrossplane?: typeof _useUpdateCrossplane;
  useManagedServicesQuery?: typeof _useManagedServicesQuery;
}

export function CrossplaneInstallDialog({
  open,
  onClose,
  mcpName,
  mcpNamespace,
  mode = 'install',
  initialData,
  useCreateCrossplane = _useCreateCrossplane,
  useUpdateCrossplane = _useUpdateCrossplane,
  useManagedServicesQuery = _useManagedServicesQuery,
}: CrossplaneInstallDialogProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const { services, crossplaneProviders } = useManagedServicesQuery();
  const { createCrossplane, loading: createLoading } = useCreateCrossplane();
  const { updateCrossplane, loading: updateLoading } = useUpdateCrossplane();
  const isLoading = createLoading || updateLoading;

  const crossplaneService = useMemo(() => services.find((s) => s.name === 'crossplane'), [services]);
  const crossplaneVersions = useMemo(() => crossplaneService?.versions ?? [], [crossplaneService]);
  const crossplaneApiVersion = crossplaneService?.apiVersion ?? 'crossplane.services.openmcp.cloud/v1alpha1';
  const crossplaneKind = crossplaneService?.kind ?? 'Crossplane';

  const schema = useMemo(() => createCrossplaneInstallSchema(t), [t]);
  const {
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors, isSubmitted },
  } = useForm<CrossplaneInstallFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      crossplaneVersion: '',
      providerStates: crossplaneProviders.map((p) => ({ name: p.name, isSelected: false, selectedVersion: '' })),
    },
  });

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && initialData) {
      reset({
        crossplaneVersion: initialData.version ?? '',
        providerStates: crossplaneProviders.map((p) => {
          const installed = initialData.providers.find((ip) => ip.name === p.name);
          return { name: p.name, isSelected: !!installed, selectedVersion: installed?.version ?? '' };
        }),
      });
    } else {
      reset({
        crossplaneVersion: '',
        providerStates: crossplaneProviders.map((p) => ({ name: p.name, isSelected: false, selectedVersion: '' })),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const crossplaneVersion = useWatch({ control, name: 'crossplaneVersion' });
  const providerStatesWatch = useWatch({ control, name: 'providerStates' });
  const providerStates = useMemo(() => providerStatesWatch ?? [], [providerStatesWatch]);

  const handleVersionChange = useCallback(
    (e: Ui5CustomEvent<SelectDomRef, { selectedOption: HTMLElement }>) => {
      setValue('crossplaneVersion', (e.detail.selectedOption as HTMLElement).dataset.version ?? '', {
        shouldValidate: isSubmitted,
      });
    },
    [setValue, isSubmitted],
  );

  const handleProviderToggle = useCallback(
    (e: Ui5CustomEvent<CheckBoxDomRef, { checked: boolean }>) => {
      const name = e.target.id;
      setValue(
        'providerStates',
        providerStates.map((p) => (p.name === name ? { ...p, isSelected: !p.isSelected } : p)),
        { shouldValidate: isSubmitted },
      );
    },
    [setValue, providerStates, isSubmitted],
  );

  const handleProviderVersionChange = useCallback(
    (e: Ui5CustomEvent<SelectDomRef, { selectedOption: HTMLElement }>) => {
      const option = e.detail.selectedOption as HTMLElement;
      const name = option.dataset.name ?? '';
      const version = option.dataset.version ?? '';
      setValue(
        'providerStates',
        providerStates.map((p) => (p.name === name ? { ...p, selectedVersion: version } : p)),
        { shouldValidate: isSubmitted },
      );
    },
    [setValue, providerStates, isSubmitted],
  );

  const onSubmit = useCallback(
    async (values: CrossplaneInstallFormValues) => {
      const object = {
        apiVersion: crossplaneApiVersion,
        kind: crossplaneKind,
        metadata: { name: mcpName, namespace: mcpNamespace },
        spec: {
          version: values.crossplaneVersion,
          providers: values.providerStates
            .filter((p) => p.isSelected)
            .map(({ name, selectedVersion }) => ({ name, version: selectedVersion })),
        },
      };
      try {
        if (mode === 'edit') {
          await updateCrossplane({ namespace: mcpNamespace, name: mcpName, object });
        } else {
          await createCrossplane({ namespace: mcpNamespace, object });
        }
        toast.show(
          mode === 'edit'
            ? t('CrossplaneInstallDialog.successMessageEdit')
            : t('CrossplaneInstallDialog.successMessage'),
        );
        handleClose();
      } catch (error) {
        console.error('Crossplane mutation failed', error);
        toast.show(
          mode === 'edit' ? t('CrossplaneInstallDialog.errorMessageEdit') : t('CrossplaneInstallDialog.errorMessage'),
        );
      }
    },
    [
      createCrossplane,
      updateCrossplane,
      mode,
      mcpName,
      mcpNamespace,
      t,
      toast,
      handleClose,
      crossplaneApiVersion,
      crossplaneKind,
    ],
  );

  const handleApply = useCallback(() => {
    handleSubmit(onSubmit)();
  }, [handleSubmit, onSubmit]);

  const yamlPreview = useMemo(() => {
    const selectedProviders = providerStates
      .filter((p) => p.isSelected)
      .map(({ name, selectedVersion }) => ({ name, version: selectedVersion || '<provider-version>' }));

    const resource: Record<string, unknown> = {
      apiVersion: crossplaneApiVersion,
      kind: crossplaneKind,
      metadata: { name: mcpName, namespace: mcpNamespace },
      spec: {
        version: crossplaneVersion || '<crossplane-version>',
        ...(selectedProviders.length > 0 && { providers: selectedProviders }),
      },
    };
    return stringify(resource);
  }, [crossplaneApiVersion, crossplaneKind, crossplaneVersion, providerStates, mcpName, mcpNamespace]);

  return (
    <Dialog
      stretch={false}
      headerText={mode === 'edit' ? t('CrossplaneInstallDialog.titleEdit') : t('CrossplaneInstallDialog.title')}
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
            {t('CrossplaneInstallDialog.crossplaneVersion')}
          </Title>
          <Select
            data-cy="crossplane-version-select"
            className={styles.versionSelect}
            accessibleName={t('CrossplaneInstallDialog.crossplaneVersion')}
            valueState={errors.crossplaneVersion ? 'Negative' : 'None'}
            valueStateMessage={errors.crossplaneVersion ? <span>{errors.crossplaneVersion.message}</span> : undefined}
            onChange={handleVersionChange}
          >
            {!crossplaneVersion && (
              <Option data-version="" selected>
                {t('ComponentsSelection.chooseVersion')}
              </Option>
            )}
            {crossplaneVersions.map(({ version }) => (
              <Option key={version} data-version={version} selected={crossplaneVersion === version}>
                {version}
              </Option>
            ))}
          </Select>

          <Title level="H5" className={styles.sectionTitle}>
            {t('CrossplaneInstallDialog.providers')}
          </Title>
          <div className={styles.providerList}>
            {providerStates.map((provider, index) => {
              const providerVersions = crossplaneProviders.find((p) => p.name === provider.name)?.versions ?? [];
              const versionError = errors.providerStates?.[index]?.selectedVersion;
              return (
                <FlexBox
                  key={provider.name}
                  justifyContent="SpaceBetween"
                  alignItems="Center"
                  className={styles.providerRow}
                >
                  <CheckBox
                    id={provider.name}
                    text={provider.name}
                    checked={provider.isSelected}
                    disabled={!crossplaneVersion}
                    onChange={handleProviderToggle}
                  />
                  <Select
                    data-cy={`provider-version-select-${provider.name}`}
                    className={styles.providerVersionSelect}
                    accessibleName={t('CrossplaneInstallDialog.providerVersionLabel', { provider: provider.name })}
                    disabled={!provider.isSelected}
                    valueState={versionError ? 'Negative' : 'None'}
                    valueStateMessage={versionError ? <span>{versionError.message}</span> : undefined}
                    onChange={handleProviderVersionChange}
                  >
                    {!provider.selectedVersion && (
                      <Option data-name={provider.name} data-version="" selected>
                        {t('ComponentsSelection.chooseVersion')}
                      </Option>
                    )}
                    {providerVersions.map(({ version }) => (
                      <Option
                        key={version}
                        data-name={provider.name}
                        data-version={version}
                        selected={provider.selectedVersion === version}
                      >
                        {version}
                      </Option>
                    ))}
                  </Select>
                </FlexBox>
              );
            })}
          </div>
        </div>
        <div className={styles.yamlColumn}>
          <Title level="H5" className={styles.sectionTitle}>
            {t('CrossplaneInstallDialog.yamlPreview')}
          </Title>
          <div className={styles.yamlViewer}>
            <YamlViewer yamlString={yamlPreview} filename={mcpName} />
          </div>
        </div>
      </div>
    </Dialog>
  );
}
