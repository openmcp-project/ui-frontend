import { CheckBox, FlexBox, Label, Option, Select, SelectDomRef, Ui5CustomEvent } from '@ui5/webcomponents-react';
import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CrossplaneProviderPicker,
  ProviderRowState,
} from '../../Shared/CrossplaneProviderPicker/CrossplaneProviderPicker.tsx';
import { ServiceSelection } from '../../../spaces/mcp/schemas/mcpV2Input.schema.ts';
import { useManagedServicesQuery } from '../../../spaces/mcp/hooks/useManagedServicesQuery.ts';
import { getHighestVersion } from '../../../utils/componentsVersions.ts';
import LogoCrossplane from '../../../assets/images/logo-crossplane.svg';
import LogoEso from '../../../assets/images/logo-eso.svg';
import LogoFlux from '../../../assets/images/logo-flux.svg';
import LogoLandscaper from '../../../assets/images/logo-landscaper.svg';
import styles from './ServiceSelectionStep.module.css';

type ServiceKey = keyof ServiceSelection;

interface ServiceDef {
  key: ServiceKey;
  labelKey: string;
  logo: string;
  serviceName: string;
}

const SERVICES: ServiceDef[] = [
  { key: 'crossplane', labelKey: 'ServiceSelectionStep.crossplane', logo: LogoCrossplane, serviceName: 'crossplane' },
  { key: 'flux', labelKey: 'ServiceSelectionStep.flux', logo: LogoFlux, serviceName: 'flux' },
  { key: 'landscaper', labelKey: 'ServiceSelectionStep.landscaper', logo: LogoLandscaper, serviceName: 'landscaper' },
  {
    key: 'externalSecretsOperator',
    labelKey: 'ServiceSelectionStep.externalSecretsOperator',
    logo: LogoEso,
    serviceName: 'external-secrets-operator',
  },
];

interface ServiceSelectionStepProps {
  services: ServiceSelection;
  onServicesChange: (services: ServiceSelection) => void;
}

export function ServiceSelectionStep({ services, onServicesChange }: ServiceSelectionStepProps) {
  const { t } = useTranslation();
  const { services: managedServices, crossplaneProviders } = useManagedServicesQuery();
  const providerVersionMemory = useRef(new Map<string, string>());

  const toggle = (key: ServiceKey, checked: boolean) => {
    const entry = services[key];
    let version = entry?.version ?? '';
    if (checked && !version) {
      const serviceName = SERVICES.find((s) => s.key === key)?.serviceName;
      const versions = managedServices.find((s) => s.name === serviceName)?.versions ?? [];
      version = getHighestVersion(versions.map((v) => v.version)) ?? '';
    }
    onServicesChange({
      ...services,
      [key]: { ...entry, selected: checked, version },
    });
  };

  const setVersion = (key: ServiceKey, version: string) => {
    onServicesChange({
      ...services,
      [key]: { ...services[key], selected: services[key]?.selected ?? false, version },
    });
  };

  const crossplaneProviderStates: ProviderRowState[] = useMemo(
    () =>
      crossplaneProviders.map((provider) => {
        const selectedProvider = services.crossplane?.providers?.find((p) => p.name === provider.name);
        return {
          name: provider.name,
          isSelected: !!selectedProvider,
          selectedVersion: selectedProvider?.version ?? '',
        };
      }),
    [crossplaneProviders, services.crossplane?.providers],
  );

  const toggleCrossplaneProvider = (name: string) => {
    const currentProviders = services.crossplane?.providers ?? [];
    const nextProviders = currentProviders.some((p) => p.name === name)
      ? currentProviders.filter((p) => p.name !== name)
      : [...currentProviders, { name, version: providerVersionMemory.current.get(name) ?? '' }];
    onServicesChange({
      ...services,
      crossplane: {
        ...services.crossplane,
        selected: services.crossplane?.selected ?? false,
        providers: nextProviders,
      },
    });
  };

  const setCrossplaneProviderVersion = (name: string, version: string) => {
    providerVersionMemory.current.set(name, version);
    const nextProviders = (services.crossplane?.providers ?? []).map((p) => (p.name === name ? { ...p, version } : p));
    onServicesChange({
      ...services,
      crossplane: {
        ...services.crossplane,
        selected: services.crossplane?.selected ?? false,
        providers: nextProviders,
      },
    });
  };

  // Self-heals providers that are selected but versionless — either just toggled on with no
  // remembered version, or prefilled from edit mode where the backend reported no version.
  useEffect(() => {
    const providers = services.crossplane?.providers;
    if (!providers?.length) return;

    let changed = false;
    const nextProviders = providers.map((p) => {
      if (p.version) return p;
      const providerVersions = crossplaneProviders.find((cp) => cp.name === p.name)?.versions ?? [];
      const highest = getHighestVersion(providerVersions.map((v) => v.version));
      if (!highest) return p;
      changed = true;
      providerVersionMemory.current.set(p.name, highest);
      return { ...p, version: highest };
    });

    if (changed) {
      onServicesChange({
        ...services,
        crossplane: {
          ...services.crossplane,
          selected: services.crossplane?.selected ?? false,
          providers: nextProviders,
        },
      });
    }
  }, [services, crossplaneProviders, onServicesChange]);

  return (
    <div className={styles.container}>
      <p className={styles.intro}>{t('ServiceSelectionStep.intro')}</p>
      <div className={styles.grid}>
        {SERVICES.map(({ key, labelKey, logo, serviceName }) => {
          const entry = services[key];
          const selected = entry?.selected ?? false;
          const versions = managedServices.find((s) => s.name === serviceName)?.versions ?? [];
          return (
            <div key={key} className={styles.row}>
              <FlexBox alignItems="Center" gap={12}>
                <img src={logo} alt={t(labelKey)} className={styles.logo} />
                <CheckBox
                  checked={selected}
                  text={t(labelKey)}
                  data-testid={`service-${key}-checkbox`}
                  onChange={(e) => toggle(key, e.target.checked)}
                />
              </FlexBox>
              {selected && (
                <FlexBox alignItems="Center" gap={8} className={styles.versionRow}>
                  <Label for={`service-${key}-version`}>{t('ServiceSelectionStep.versionLabel')}</Label>
                  <Select
                    id={`service-${key}-version`}
                    data-testid={`service-${key}-version`}
                    accessibleName={t('ServiceSelectionStep.versionLabel')}
                    value={entry?.version ?? ''}
                    className={styles.versionSelect}
                    onChange={(e: Ui5CustomEvent<SelectDomRef, { selectedOption: HTMLElement }>) =>
                      setVersion(key, e.detail.selectedOption.getAttribute('value') ?? '')
                    }
                  >
                    {versions.map(({ version: v }) => (
                      <Option key={v} value={v}>
                        {v}
                      </Option>
                    ))}
                  </Select>
                </FlexBox>
              )}
              {key === 'crossplane' && selected && (
                <div className={styles.providersSection}>
                  <Label>{t('ComponentInstallDialog.providers')}</Label>
                  <CrossplaneProviderPicker
                    providers={crossplaneProviderStates}
                    catalog={crossplaneProviders}
                    disabled={!entry?.version}
                    onToggle={toggleCrossplaneProvider}
                    onVersionChange={setCrossplaneProviderVersion}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
