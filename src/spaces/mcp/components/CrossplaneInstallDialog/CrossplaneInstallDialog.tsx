import { useMutation } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import '@ui5/webcomponents-fiori/dist/illustrations/AllIllustrations.js';
import IllustrationMessageDesign from '@ui5/webcomponents-fiori/dist/types/IllustrationMessageDesign.js';
import IllustrationMessageType from '@ui5/webcomponents-fiori/dist/types/IllustrationMessageType.js';
import {
  Bar,
  Button,
  CheckBox,
  CheckBoxDomRef,
  Dialog,
  FlexBox,
  IllustratedMessage,
  Option,
  Select,
  SelectDomRef,
  Title,
  Ui5CustomEvent,
} from '@ui5/webcomponents-react';
import ButtonDesign from '@ui5/webcomponents/dist/types/ButtonDesign.js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { stringify } from 'yaml';
import { YamlViewer } from '../../../../components/Yaml/YamlViewer.tsx';
import { useToast } from '../../../../context/ToastContext.tsx';
import type { CrossplaneData } from '../../types/Crossplane.ts';
import { useManagedServicesQuery } from '../Kpi/useManagedServicesQuery.ts';
import styles from './CrossplaneInstallDialog.module.css';
import { createCrossplaneInstallSchema, CrossplaneInstallFormValues } from './CrossplaneInstallDialog.schema.ts';
import { CreateCrossplaneMutation } from './useCreateCrossplaneMutation.ts';
import { UpdateCrossplaneMutation } from './useUpdateCrossplaneMutation.ts';

interface CrossplaneInstallDialogProps {
  open: boolean;
  onClose: () => void;
  mcpName: string;
  mcpNamespace: string;
  mode?: 'install' | 'edit';
  initialData?: CrossplaneData;
}

export function CrossplaneInstallDialog({
  open,
  onClose,
  mcpName,
  mcpNamespace,
  mode = 'install',
  initialData,
}: CrossplaneInstallDialogProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const { services, crossplaneProviders } = useManagedServicesQuery();
  const [createCrossplane] = useMutation(CreateCrossplaneMutation);
  const [updateCrossplane] = useMutation(UpdateCrossplaneMutation);
  const [isSuccess, setIsSuccess] = useState(false);

  const crossplaneService = useMemo(() => services.find((s) => s.name === 'crossplane'), [services]);
  const crossplaneVersions = useMemo(() => crossplaneService?.versions ?? [], [crossplaneService]);

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
    setIsSuccess(false);
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
        apiVersion: 'crossplane.services.openmcp.cloud/v1alpha1',
        kind: 'Crossplane',
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
          await updateCrossplane({
            variables: { namespace: mcpNamespace, name: mcpName, object },
          });
        } else {
          await createCrossplane({
            variables: { namespace: mcpNamespace, object },
          });
        }
        setIsSuccess(true);
      } catch {
        toast.show(
          mode === 'edit' ? t('CrossplaneInstallDialog.errorMessageEdit') : t('CrossplaneInstallDialog.errorMessage'),
        );
      }
    },
    [createCrossplane, updateCrossplane, mode, mcpName, mcpNamespace, t, toast],
  );

  const handleApply = useCallback(() => {
    handleSubmit(onSubmit)();
  }, [handleSubmit, onSubmit]);

  const isEditMode = mode === 'edit';

  const yamlPreview = useMemo(() => {
    const selectedProviders = providerStates
      .filter((p) => p.isSelected)
      .map(({ name, selectedVersion }) => ({ name, version: selectedVersion || '<provider-version>' }));

    const resource: Record<string, unknown> = {
      apiVersion: crossplaneService?.apiVersion ?? 'crossplane.services.openmcp.cloud/v1alpha1',
      kind: crossplaneService?.kind ?? 'Crossplane',
      metadata: { name: mcpName, namespace: mcpNamespace },
      spec: {
        version: crossplaneVersion || '<crossplane-version>',
        ...(selectedProviders.length > 0 && { providers: selectedProviders }),
      },
    };
    return stringify(resource);
  }, [crossplaneService, crossplaneVersion, providerStates, mcpName, mcpNamespace]);

  return (
    <Dialog
      stretch={false}
      headerText={isEditMode ? t('CrossplaneInstallDialog.titleEdit') : t('CrossplaneInstallDialog.title')}
      open={open}
      footer={
        <Bar
          design="Footer"
          endContent={
            isSuccess ? (
              <Button design={ButtonDesign.Emphasized} onClick={handleClose}>
                {t('common.close')}
              </Button>
            ) : (
              <>
                <Button design={ButtonDesign.Transparent} onClick={handleClose}>
                  {t('common.cancel')}
                </Button>
                <Button design={ButtonDesign.Emphasized} onClick={handleApply}>
                  {t('common.applyChanges')}
                </Button>
              </>
            )
          }
        />
      }
    >
      {isSuccess ? (
        <div className={styles.content}>
          <IllustratedMessage
            design={IllustrationMessageDesign.Large}
            name={IllustrationMessageType.KeyTask}
            titleText={
              isEditMode ? t('CrossplaneInstallDialog.successTitleEdit') : t('CrossplaneInstallDialog.successTitle')
            }
            subtitleText={
              isEditMode
                ? t('CrossplaneInstallDialog.successSubtitleEdit')
                : t('CrossplaneInstallDialog.successSubtitle')
            }
          />
        </div>
      ) : (
        <div className={styles.content}>
          <div className={styles.formColumn}>
            <Title level="H5" className={styles.sectionTitle}>
              {t('CrossplaneInstallDialog.crossplaneVersion')}
            </Title>
            <Select
              className={styles.versionSelect}
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
                      className={styles.providerVersionSelect}
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
      )}
    </Dialog>
  );
}
