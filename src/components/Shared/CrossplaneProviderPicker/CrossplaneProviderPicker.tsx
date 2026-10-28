import {
  CheckBox,
  FlexBox,
  Icon,
  ObjectStatus,
  Option,
  Select,
  SelectDomRef,
  Ui5CustomEvent,
} from '@ui5/webcomponents-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { CrossplaneProvider } from '../../../spaces/mcp/hooks/useManagedServicesQuery.ts';
import type { ProviderRecommendation } from './useProviderRecommendations.ts';
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
  recommendations?: ProviderRecommendation[];
  onToggle: (name: string) => void;
  onVersionChange: (name: string, version: string) => void;
  getError?: (name: string) => string | undefined;
}

export function CrossplaneProviderPicker({
  providers,
  catalog,
  disabled = false,
  recommendations = [],
  onToggle,
  onVersionChange,
  getError,
}: CrossplaneProviderPickerProps) {
  const { t } = useTranslation();

  // Rank of each recommended provider (0 = strongest). Recommended providers float to the top in
  // score order; everything else keeps the plain alphabetical order below them.
  const recommendationRank = useMemo(() => {
    const rank = new Map<string, number>();
    recommendations.forEach((rec, index) => rank.set(rec.provider, index));
    return rank;
  }, [recommendations]);

  const sortedProviders = useMemo(() => {
    const alphabetical = providers.toSorted((a, b) => a.name.localeCompare(b.name));
    return alphabetical.toSorted((a, b) => {
      const rankA = recommendationRank.get(a.name);
      const rankB = recommendationRank.get(b.name);
      if (rankA === undefined && rankB === undefined) return 0;
      if (rankA === undefined) return 1;
      if (rankB === undefined) return -1;
      return rankA - rankB;
    });
  }, [providers, recommendationRank]);

  return (
    <div className={styles.providerList}>
      {sortedProviders.map((provider) => {
        const providerVersions = catalog.find((p) => p.name === provider.name)?.versions ?? [];
        const currentVersion = provider.selectedVersion;
        const versionOptions =
          currentVersion && !providerVersions.some((v) => v.version === currentVersion)
            ? [{ version: currentVersion }, ...providerVersions]
            : providerVersions;
        const versionError = getError?.(provider.name);
        return (
          <FlexBox key={provider.name} justifyContent="SpaceBetween" alignItems="Center" className={styles.providerRow}>
            <FlexBox alignItems="Center" gap={8}>
              <CheckBox
                id={provider.name}
                text={provider.name}
                checked={provider.isSelected}
                disabled={disabled}
                onChange={() => onToggle(provider.name)}
              />
              {recommendationRank.has(provider.name) && (
                <ObjectStatus state="Information" icon={<Icon name="thumb-up" />}>
                  {t('CrossplaneProviderPicker.recommendedBadge')}
                </ObjectStatus>
              )}
            </FlexBox>
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
        );
      })}
    </div>
  );
}
