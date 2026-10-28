import { CheckBox, FlexBox, Label, Option, Select, SelectDomRef, Ui5CustomEvent } from '@ui5/webcomponents-react';
import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CrossplaneProviderPicker,
  ProviderRowState,
} from '../../Shared/CrossplaneProviderPicker/CrossplaneProviderPicker.tsx';
import { ServiceSelection } from '../../../spaces/mcp/schemas/mcpV2Input.schema.ts';
import { useManagedServicesQuery as _useManagedServicesQuery } from '../../../spaces/mcp/hooks/useManagedServicesQuery.ts';
import {
  CONTROL_PLANE_V2_SERVICES,
  getVisibleControlPlaneV2Services,
  ServiceKey,
} from '../../../spaces/controlPlaneV2/helpers/controlPlaneV2Services.ts';
import { getHighestVersion } from '../../../utils/componentsVersions.ts';
import { YamlViewToggleButton } from '../../Yaml/YamlViewToggleButton.tsx';
import { ServicesYamlPreview } from './ServicesYamlPreview.tsx';
import styles from './ServiceSelectionStep.module.css';
import Loading from '../../Shared/Loading.tsx';

interface ServiceSelectionStepProps {
  services: ServiceSelection;
  onServicesChange: (services: ServiceSelection) => void;
  showLandscaper: boolean;
  /** Service whose YAML is shown in the preview; follows the most recent change on the left. */
  activeService: ServiceKey;
  onActiveServiceChange: (key: ServiceKey) => void;
  resourceName: string;
  resourceNamespace: string;
  isEditMode?: boolean;
  initialServices?: ServiceSelection;
  useManagedServicesQuery?: typeof _useManagedServicesQuery;
}

export function ServiceSelectionStep({
  services,
  onServicesChange,
  showLandscaper,
  activeService,
  onActiveServiceChange,
  resourceName,
  resourceNamespace,
  isEditMode = false,
  initialServices,
  useManagedServicesQuery = _useManagedServicesQuery,
}: ServiceSelectionStepProps) {
  const { t } = useTranslation();
  const { services: managedServices, crossplaneProviders, isLoading } = useManagedServicesQuery();
  const providerVersionMemory = useRef(new Map<string, string>());
  const visibleServices = useMemo(() => getVisibleControlPlaneV2Services(showLandscaper), [showLandscaper]);

  const toggle = (key: ServiceKey, checked: boolean) => {
    const entry = services[key];
    let version = entry?.version ?? '';
    if (checked && !version) {
      const serviceName = CONTROL_PLANE_V2_SERVICES.find((s) => s.key === key)?.serviceName;
      const versions = managedServices.find((s) => s.name === serviceName)?.versions ?? [];
      version = getHighestVersion(versions.map((v) => v.version)) ?? '';
    }
    onActiveServiceChange(key);
    onServicesChange({
      ...services,
      [key]: { ...entry, selected: checked, version },
    });
  };

  const setVersion = (key: ServiceKey, version: string) => {
    onActiveServiceChange(key);
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
    onActiveServiceChange('crossplane');
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
    onActiveServiceChange('crossplane');
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
  if (isLoading)
    return (
      <div className={styles.container}>
        <Loading />
      </div>
    );
  return (
    <div className={styles.layout}>
      <div className={styles.container}>
        <p className={styles.intro}>{t('ServiceSelectionStep.intro')}</p>
        <div className={styles.grid}>
          {visibleServices.map(({ key, labelKey, logo, serviceName }) => {
            const entry = services[key];
            const selected = entry?.selected ?? false;
            const versions = managedServices.find((s) => s.name === serviceName)?.versions ?? [];
            const currentVersion = entry?.version ?? '';
            const versionOptions =
              currentVersion && !versions.some((v) => v.version === currentVersion)
                ? [{ version: currentVersion }, ...versions]
                : versions;
            return (
              <div
                key={key}
                className={`${styles.row} ${key === activeService ? styles.rowActive : ''}`.trim()}
                data-testid={`service-${key}-card`}
              >
                <FlexBox alignItems="Center" justifyContent="SpaceBetween" gap={12}>
                  <FlexBox alignItems="Center" gap={12}>
                    <img src={logo} alt={t(labelKey)} className={styles.logo} />
                    <CheckBox
                      checked={selected}
                      text={t(labelKey)}
                      data-testid={`service-${key}-checkbox`}
                      onChange={(e) => toggle(key, e.target.checked)}
                    />
                  </FlexBox>
                  <YamlViewToggleButton
                    pressed={key === activeService}
                    data-testid={`service-${key}-yaml-button`}
                    onClick={() => onActiveServiceChange(key)}
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
                      {versionOptions.map(({ version: v }) => (
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
      <div className={styles.preview}>
        <ServicesYamlPreview
          services={services}
          visibleServices={visibleServices}
          activeService={activeService}
          resourceName={resourceName}
          resourceNamespace={resourceNamespace}
          isEditMode={isEditMode}
          initialServices={initialServices}
          onActiveServiceChange={onActiveServiceChange}
        />
      </div>
    </div>
  );
}
