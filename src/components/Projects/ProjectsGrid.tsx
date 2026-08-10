import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import '@ui5/webcomponents-icons/dist/slim-arrow-right.js';
import { Icon } from '@ui5/webcomponents-react';
import { useProjectMembers as _useProjectMembers } from '../../spaces/onboarding/hooks/useProjectMembers';
import { isKnownLandscape } from '../../lib/supportInfo.ts';
import { ProjectCard } from './ProjectCard.tsx';
import workspaceStyles from '../ControlPlanes/List/WorkspacesList.module.css';
import styles from './ProjectsGrid.module.css';

const PURPOSE_ORDER = ['production', 'validation', 'testing'] as const;

export type GroupMode = 'none' | 'purpose' | 'created';

interface GroupEntry {
  key: string;
  label: string;
  names: string[];
}

interface Props {
  projectNames: string[];
  search: string;
  groupMode: GroupMode;
  expandedGroups: Set<string> | null; // null = all expanded
  setAsDefaultRef: React.RefObject<boolean>;
  useProjectMembers?: typeof _useProjectMembers;
  onGroupKeysChanged?: (keys: string[]) => void;
  onProjectSelect?: (projectName: string) => void;
  onToggleGroup?: (groupKey: string) => void;
}

export function ProjectsGrid({
  projectNames,
  search,
  groupMode,
  expandedGroups,
  setAsDefaultRef,
  useProjectMembers,
  onGroupKeysChanged,
  onProjectSelect,
  onToggleGroup,
}: Props) {
  const { t } = useTranslation();

  const [purposeMap, setPurposeMap] = useState<Map<string, string | undefined>>(() => new Map());
  const [displayNameMap, setDisplayNameMap] = useState<Map<string, string | undefined>>(() => new Map());
  const [timestampMap, setTimestampMap] = useState<Map<string, string | undefined>>(() => new Map());

  const handlePurposeResolved = useCallback((name: string, landscape: string | undefined) => {
    setPurposeMap((prev) => {
      if (prev.get(name) === landscape) return prev;
      const next = new Map(prev);
      next.set(name, landscape);
      return next;
    });
  }, []);

  const handleDisplayNameResolved = useCallback((name: string, displayName: string | undefined) => {
    setDisplayNameMap((prev) => {
      if (prev.get(name) === displayName) return prev;
      const next = new Map(prev);
      next.set(name, displayName);
      return next;
    });
  }, []);

  const handleTimestampResolved = useCallback((name: string, ts: string | undefined) => {
    setTimestampMap((prev) => {
      if (prev.get(name) === ts) return prev;
      const next = new Map(prev);
      next.set(name, ts);
      return next;
    });
  }, []);

  const query = search.trim().toLowerCase();

  const filteredNames = useMemo(() => {
    if (!query) return projectNames;
    return projectNames.filter((name) => {
      if (name.toLowerCase().includes(query)) return true;
      const dn = displayNameMap.get(name)?.toLowerCase() ?? '';
      return dn.includes(query);
    });
  }, [projectNames, query, displayNameMap]);

  const sortByDisplayName = useCallback(
    (names: string[]) =>
      [...names].sort((a, b) => {
        const da = displayNameMap.get(a) ?? a;
        const db = displayNameMap.get(b) ?? b;
        return da.localeCompare(db);
      }),
    [displayNameMap],
  );

  const groups = useMemo<GroupEntry[]>(() => {
    if (groupMode === 'none') return [];

    if (groupMode === 'purpose') {
      const byPurpose = new Map<string, string[]>();
      for (const name of filteredNames) {
        const landscape = purposeMap.get(name);
        const key = landscape && isKnownLandscape(landscape) ? landscape : '';
        if (!byPurpose.has(key)) byPurpose.set(key, []);
        byPurpose.get(key)!.push(name);
      }

      const result: GroupEntry[] = [];
      for (const purpose of PURPOSE_ORDER) {
        const names = byPurpose.get(purpose);
        if (names && names.length > 0) {
          result.push({ key: purpose, label: t(`SupportInfo.landscape.${purpose}`), names: sortByDisplayName(names) });
        }
      }
      const unset = byPurpose.get('');
      if (unset && unset.length > 0) {
        result.push({ key: 'unset', label: t('ProjectsListView.groupUnset'), names: sortByDisplayName(unset) });
      }
      return result;
    }

    // groupMode === 'created': group by "Month YYYY", newest first
    const byDate = new Map<string, string[]>();
    for (const name of filteredNames) {
      const ts = timestampMap.get(name);
      const key = ts ? new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'long' }) : 'unknown';
      if (!byDate.has(key)) byDate.set(key, []);
      byDate.get(key)!.push(name);
    }
    // Sort by actual date descending — derive a sortable value from the first item's ts
    const dateKeys = [...byDate.keys()].sort((a, b) => {
      const tsA = filteredNames.find((n) => byDate.get(a)?.includes(n));
      const tsB = filteredNames.find((n) => byDate.get(b)?.includes(n));
      const dA = tsA ? (timestampMap.get(tsA) ?? '') : '';
      const dB = tsB ? (timestampMap.get(tsB) ?? '') : '';
      return dB.localeCompare(dA);
    });
    return dateKeys.map((key) => ({
      key,
      label: key === 'unknown' ? t('ProjectsListView.groupUnknownYear') : key,
      names: sortByDisplayName(byDate.get(key)!),
    }));
  }, [groupMode, filteredNames, purposeMap, timestampMap, sortByDisplayName, t]);

  const groupKeys = useMemo(() => groups.map((g) => g.key), [groups]);
  useEffect(() => {
    onGroupKeysChanged?.(groupKeys);
  }, [groupKeys, onGroupKeysChanged]);

  const hasPurposeData = purposeMap.size > 0;
  const hasTimestampData = timestampMap.size > 0;
  const canGroup =
    groupMode === 'none' ||
    (groupMode === 'purpose' && hasPurposeData && groups.length > 1) ||
    (groupMode === 'created' && hasTimestampData && groups.length > 1);

  const renderCard = (name: string) => (
    <ProjectCard
      key={name}
      projectName={name}
      setAsDefaultRef={setAsDefaultRef}
      useProjectMembers={useProjectMembers}
      onDisplayNameResolved={handleDisplayNameResolved}
      onProjectSelect={onProjectSelect}
      onPurposeResolved={handlePurposeResolved}
      onTimestampResolved={handleTimestampResolved}
    />
  );

  if (groupMode === 'none' || !canGroup || groups.length <= 1) {
    return (
      <div className={styles.outerWrapper}>
        <div className={workspaceStyles.wrapper}>
          <div className={workspaceStyles.grid}>{filteredNames.map(renderCard)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.outerWrapper}>
      {groups.map((group) => {
        const isExpanded = expandedGroups === null || expandedGroups.has(group.key);
        return (
          <div key={group.key} className={styles.groupSection}>
            <div className={workspaceStyles.workspaceHeader}>
              <button
                aria-expanded={isExpanded}
                className={workspaceStyles.workspaceToggle}
                type="button"
                onClick={() => onToggleGroup?.(group.key)}
              >
                <Icon
                  className={`${workspaceStyles.chevron} ${isExpanded ? workspaceStyles.chevronOpen : ''}`}
                  name="slim-arrow-right"
                />
                <span className={workspaceStyles.workspaceEyebrow}>{group.label}</span>
                <span className={styles.groupCount}>({group.names.length})</span>
              </button>
            </div>
            {isExpanded && (
              <div className={workspaceStyles.wrapper}>
                <div className={workspaceStyles.grid}>{group.names.map(renderCard)}</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
