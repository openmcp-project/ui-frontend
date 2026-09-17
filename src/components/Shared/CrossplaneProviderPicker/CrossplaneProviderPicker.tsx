import { CheckBox, FlexBox, Option, Select, SelectDomRef, Ui5CustomEvent } from '@ui5/webcomponents-react';
import { useTranslation } from 'react-i18next';
import type { CrossplaneProvider } from '../../../spaces/mcp/hooks/useManagedServicesQuery.ts';
import { latestAvailableVersion } from '../../../utils/componentsVersions.ts';
import styles from './CrossplaneProviderPicker.module.css';

export interface ProviderRowState {
  name: string;
  isSelected: boolean;
  selectedVersion: string;
}

export interface CrossplaneProviderPickerProps {
  providers: ProviderRowState[];
  catalog: CrossplaneProvider[];
  disabled?: boolean;
  onToggle: (name: string) => void;
  onVersionChange: (name: string, version: string) => void;
  getError?: (name: string) => string | undefined;
}

export function CrossplaneProviderPicker({
  providers,
  catalog,
  disabled = false,
  onToggle,
  onVersionChange,
  getError,
}: CrossplaneProviderPickerProps) {
  const { t } = useTranslation();

  return (
    <div className={styles.providerList}>
      {providers.map((provider) => {
        const providerVersions = catalog.find((p) => p.name === provider.name)?.versions ?? [];
        const currentVersion = provider.selectedVersion;
        const versionOptions =
          currentVersion && !providerVersions.some((v) => v.version === currentVersion)
            ? [{ version: currentVersion }, ...providerVersions]
            : providerVersions;
        const versionError = getError?.(provider.name);
        const newerVersion = latestAvailableVersion(
          currentVersion,
          providerVersions.map((v) => v.version),
        );
        return (
          <FlexBox key={provider.name} justifyContent="SpaceBetween" alignItems="Center" className={styles.providerRow}>
            <CheckBox
              id={provider.name}
              text={provider.name}
              checked={provider.isSelected}
              disabled={disabled}
              onChange={() => onToggle(provider.name)}
            />
            <FlexBox alignItems="Center" gap={8}>
              {newerVersion && provider.isSelected && (
                <span className={styles.updateHint} title={t('CrossplaneProviderPicker.updateAvailableTooltip', { version: newerVersion })}>
                  ↑ {newerVersion}
                </span>
              )}
              <Select
                data-cy={`provider-version-select-${provider.name}`}
                data-name={provider.name}
                className={styles.providerVersionSelect}
                accessibleName={t('ComponentInstallDialog.providerVersionLabel', { provider: provider.name })}
                disabled={!provider.isSelected}
                value={provider.selectedVersion}
                valueState={versionError ? 'Negative' : 'None'}
                valueStateMessage={versionError ? <span>{versionError}</span> : undefined}
                onChange={(e: Ui5CustomEvent<SelectDomRef, { selectedOption: HTMLElement }>) =>
                  onVersionChange(provider.name, e.detail.selectedOption.getAttribute('value') ?? '')
                }
              >
                {versionOptions.map(({ version }) => (
                  <Option key={version} value={version}>
                    {version}
                  </Option>
                ))}
              </Select>
            </FlexBox>
          </FlexBox>
        );
      })}
      <p className={styles.disclaimer}>{t('CrossplaneProviderPicker.testingDisclaimer')}</p>
    </div>
  );
}
