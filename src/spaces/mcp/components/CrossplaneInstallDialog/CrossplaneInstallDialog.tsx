import { useMutation } from '@apollo/client/react';
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
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../../../context/ToastContext.tsx';
import { useManagedServicesQuery } from '../Kpi/useManagedServicesQuery.ts';
import styles from './CrossplaneInstallDialog.module.css';
import { CreateCrossplaneMutation } from './useCreateCrossplaneMutation.ts';

interface ProviderState {
  name: string;
  isSelected: boolean;
  selectedVersion: string;
}

interface CrossplaneInstallDialogProps {
  open: boolean;
  onClose: () => void;
  mcpName: string;
  mcpNamespace: string;
}

export function CrossplaneInstallDialog({ open, onClose, mcpName, mcpNamespace }: CrossplaneInstallDialogProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const { services, crossplaneProviders } = useManagedServicesQuery();
  const [createCrossplane] = useMutation(CreateCrossplaneMutation);

  const crossplaneVersions = useMemo(() => services.find((s) => s.name === 'crossplane')?.versions ?? [], [services]);

  const [crossplaneVersion, setCrossplaneVersion] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [providerStates, setProviderStates] = useState<ProviderState[]>(() =>
    crossplaneProviders.map((p) => ({ name: p.name, isSelected: false, selectedVersion: '' })),
  );

  const handleVersionChange = useCallback((e: Ui5CustomEvent<SelectDomRef, { selectedOption: HTMLElement }>) => {
    setCrossplaneVersion((e.detail.selectedOption as HTMLElement).dataset.version ?? '');
  }, []);

  const handleProviderToggle = useCallback((e: Ui5CustomEvent<CheckBoxDomRef, { checked: boolean }>) => {
    const name = e.target.id;
    setProviderStates((prev) => prev.map((p) => (p.name === name ? { ...p, isSelected: !p.isSelected } : p)));
  }, []);

  const handleProviderVersionChange = useCallback(
    (e: Ui5CustomEvent<SelectDomRef, { selectedOption: HTMLElement }>) => {
      const option = e.detail.selectedOption as HTMLElement;
      const name = option.dataset.name ?? '';
      const version = option.dataset.version ?? '';
      setProviderStates((prev) => prev.map((p) => (p.name === name ? { ...p, selectedVersion: version } : p)));
    },
    [],
  );

  const handleApply = useCallback(async () => {
    try {
      await createCrossplane({
        variables: {
          namespace: mcpNamespace,
          object: {
            apiVersion: 'crossplane.services.openmcp.cloud/v1alpha1',
            kind: 'Crossplane',
            metadata: { name: mcpName, namespace: mcpNamespace },
            spec: {
              version: crossplaneVersion,
              providers: providerStates
                .filter((p) => p.isSelected)
                .map(({ name, selectedVersion }) => ({ name, version: selectedVersion })),
            },
          },
        },
      });
      setIsSuccess(true);
    } catch {
      toast.show(t('CrossplaneInstallDialog.errorMessage'));
    }
  }, [createCrossplane, crossplaneVersion, mcpName, mcpNamespace, providerStates, t, toast]);

  return (
    <Dialog
      stretch={false}
      headerText={t('CrossplaneInstallDialog.title')}
      open={open}
      footer={
        <Bar
          design="Footer"
          endContent={
            isSuccess ? (
              <Button design={ButtonDesign.Emphasized} onClick={onClose}>
                {t('common.close')}
              </Button>
            ) : (
              <>
                <Button design={ButtonDesign.Transparent} onClick={onClose}>
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
            titleText={t('CrossplaneInstallDialog.successTitle')}
            subtitleText={t('CrossplaneInstallDialog.successSubtitle')}
          />
        </div>
      ) : (
        <div className={styles.content}>
          <Title level="H5" className={styles.sectionTitle}>
            {t('CrossplaneInstallDialog.crossplaneVersion')}
          </Title>
          <Select className={styles.versionSelect} onChange={handleVersionChange}>
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
            {providerStates.map((provider) => {
              const providerVersions = crossplaneProviders.find((p) => p.name === provider.name)?.versions ?? [];
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
      )}
    </Dialog>
  );
}
