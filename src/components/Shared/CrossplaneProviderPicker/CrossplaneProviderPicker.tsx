import {
  Button,
  CheckBox,
  FlexBox,
  Icon,
  Input,
  InputDomRef,
  Option,
  Select,
  SelectDomRef,
  Text,
  Ui5CustomEvent,
} from '@ui5/webcomponents-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CrossplaneProvider } from '../../../spaces/mcp/hooks/useManagedServicesQuery.ts';
import type { ProviderRecommendation } from './useProviderRecommendations.ts';
import { Infobox } from '../../Ui/Infobox/Infobox.tsx';
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

const PROVIDER_PREFIX = 'provider-';
const PAGE_SIZE = 5;

function stripProviderPrefix(name: string): string {
  return name.startsWith(PROVIDER_PREFIX) ? name.slice(PROVIDER_PREFIX.length) : name;
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
  const [searchTerm, setSearchTerm] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [requestedPage, setRequestedPage] = useState(1);

  // Rank of each recommended provider (0 = strongest). Recommended providers float to the top of
  // the whole list in score order so they always land on the first page; the rest keep the
  // alphabetical order chosen by the sort toggle.
  const recommendationRank = useMemo(() => {
    const rank = new Map<string, number>();
    recommendations.forEach((rec, index) => rank.set(rec.provider, index));
    return rank;
  }, [recommendations]);

  const displayProviders = useMemo(
    () => providers.map((provider) => ({ ...provider, label: stripProviderPrefix(provider.name) })),
    [providers],
  );

  const filteredProviders = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    return displayProviders.filter((provider) => provider.label.toLowerCase().includes(lowerSearch));
  }, [displayProviders, searchTerm]);

  const sortedProviders = useMemo(() => {
    const alphabetical = filteredProviders.toSorted((a, b) =>
      sortDirection === 'asc' ? a.label.localeCompare(b.label) : b.label.localeCompare(a.label),
    );
    return alphabetical.toSorted((a, b) => {
      const rankA = recommendationRank.get(a.name);
      const rankB = recommendationRank.get(b.name);
      if (rankA === undefined && rankB === undefined) return 0;
      if (rankA === undefined) return 1;
      if (rankB === undefined) return -1;
      return rankA - rankB;
    });
  }, [filteredProviders, sortDirection, recommendationRank]);

  const totalPages = Math.max(1, Math.ceil(sortedProviders.length / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);
  const pageProviders = useMemo(
    () => sortedProviders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [sortedProviders, currentPage],
  );

  const handleSearch = (e: Ui5CustomEvent<InputDomRef, never>) => {
    setSearchTerm(e.target.value.trim());
    setRequestedPage(1);
  };

  const toggleSortDirection = () => {
    setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'));
    setRequestedPage(1);
  };

  return (
    <div>
      <FlexBox alignItems="Center" justifyContent="SpaceBetween" className={styles.providerHeader}>
        <Button
          design="Transparent"
          endIcon={sortDirection === 'asc' ? 'sort-ascending' : 'sort-descending'}
          aria-label={
            sortDirection === 'asc'
              ? t('ComponentInstallDialog.sortAscending')
              : t('ComponentInstallDialog.sortDescending')
          }
          onClick={toggleSortDirection}
        >
          {t('ComponentInstallDialog.providerNameHeader')}
        </Button>
        <Input
          placeholder={t('ComponentInstallDialog.searchProviders')}
          id="provider-search"
          showClearIcon
          icon={<Icon name="search" />}
          value={searchTerm}
          className={styles.providerSearch}
          aria-label={t('ComponentInstallDialog.searchProviders')}
          onInput={handleSearch}
        />
      </FlexBox>

      {pageProviders.length > 0 ? (
        <div className={styles.providerList}>
          {pageProviders.map((provider) => {
            const providerVersions = catalog.find((p) => p.name === provider.name)?.versions ?? [];
            const currentVersion = provider.selectedVersion;
            const versionOptions =
              currentVersion && !providerVersions.some((v) => v.version === currentVersion)
                ? [{ version: currentVersion }, ...providerVersions]
                : providerVersions;
            const versionError = getError?.(provider.name);
            const isRecommended = recommendationRank.has(provider.name);
            return (
              <FlexBox
                key={provider.name}
                justifyContent="SpaceBetween"
                alignItems="Center"
                className={isRecommended ? `${styles.providerRow} ${styles.recommendedRow}` : styles.providerRow}
              >
                {isRecommended && (
                  <div className={styles.recommendedBadge}>
                    <Text className={styles.recommendedLabel}>{t('CrossplaneProviderPicker.recommendedBadge')}</Text>
                    <span className={styles.recommendedTooltip} role="tooltip">
                      {t('CrossplaneProviderPicker.recommendedTooltip')}
                    </span>
                  </div>
                )}
                <CheckBox
                  id={provider.name}
                  text={provider.label}
                  checked={provider.isSelected}
                  disabled={disabled}
                  onChange={() => onToggle(provider.name)}
                />
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
      ) : (
        <Infobox fullWidth variant="normal" icon="search">
          <Text>{t('ComponentInstallDialog.noProvidersFound')}</Text>
        </Infobox>
      )}

      {totalPages > 1 && (
        <FlexBox alignItems="Center" justifyContent="Center" className={styles.pagination}>
          <Button
            design="Transparent"
            icon="navigation-left-arrow"
            disabled={currentPage === 1}
            aria-label={t('ComponentInstallDialog.paginationPrevious')}
            onClick={() => setRequestedPage(Math.max(1, currentPage - 1))}
          />
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              design={page === currentPage ? 'Emphasized' : 'Transparent'}
              aria-label={t('ComponentInstallDialog.paginationPage', { page })}
              onClick={() => setRequestedPage(page)}
            >
              {page}
            </Button>
          ))}
          <Button
            design="Transparent"
            icon="navigation-right-arrow"
            disabled={currentPage === totalPages}
            aria-label={t('ComponentInstallDialog.paginationNext')}
            onClick={() => setRequestedPage(Math.min(totalPages, currentPage + 1))}
          />
        </FlexBox>
      )}
    </div>
  );
}
