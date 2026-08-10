import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import '@ui5/webcomponents-icons/dist/slim-arrow-right.js';
import { Icon } from '@ui5/webcomponents-react';
import { useProjectMembers as _useProjectMembers } from '../../spaces/onboarding/hooks/useProjectMembers';
import { isKnownLandscape } from '../../lib/supportInfo.ts';
import { ProjectCard } from './ProjectCard.tsx';
import workspaceStyles from '../ControlPlanes/List/WorkspacesList.module.css';
import styles from './ProjectsGrid.module.css';

const PURPOSE_ORDER = ['production', 'validation', 'testing', 'experimental'] as const;

export type GroupMode = 'none' | 'purpose' | 'created' | 'chargingTarget';
export type SortMode = 'name-asc' | 'name-desc' | 'created-asc' | 'created-desc';

interface GroupEntry {
  key: string;
  label: string;
  names: string[];
}

interface Props {
  projectNames: string[];
  search: string;
  groupMode: GroupMode;
  sortMode: SortMode;
  expandedGroups: Set<string> | null;
  setAsDefaultRef: React.RefObject<boolean>;
  useProjectMembers?: typeof _useProjectMembers;
  onGroupKeysChanged?: (keys: string[]) => void;
  onProjectSelect?: (projectName: string) => void;
  onTimestampResolved?: (name: string, ts: string | undefined) => void;
  onToggleGroup?: (groupKey: string) => void;
}

export function ProjectsGrid({
  projectNames,
  search,
  groupMode,
  sortMode,
  expandedGroups,
  setAsDefaultRef,
  useProjectMembers,
  onGroupKeysChanged,
  onProjectSelect,
  onTimestampResolved: onTimestampResolvedProp,
  onToggleGroup,
}: Props) {
  const { t } = useTranslation();

  const [purposeMap, setPurposeMap] = useState<Map<string, string | undefined>>(() => new Map());
  const [displayNameMap, setDisplayNameMap] = useState<Map<string, string | undefined>>(() => new Map());
  const [timestampMap, setTimestampMap] = useState<Map<string, string | undefined>>(() => new Map());
  const [chargingTargetMap, setChargingTargetMap] = useState<Map<string, string | undefined>>(() => new Map());

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

  const handleTimestampResolved = useCallback(
    (name: string, ts: string | undefined) => {
      setTimestampMap((prev) => {
        if (prev.get(name) === ts) return prev;
        const next = new Map(prev);
        next.set(name, ts);
        return next;
      });
      onTimestampResolvedProp?.(name, ts);
    },
    [onTimestampResolvedProp],
  );

  const handleChargingTargetResolved = useCallback((name: string, target: string | undefined) => {
    setChargingTargetMap((prev) => {
      if (prev.get(name) === target) return prev;
      const next = new Map(prev);
      next.set(name, target);
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

  // Apply sort
  const sortedNames = useMemo(() => {
    return [...filteredNames].sort((a, b) => {
      switch (sortMode) {
        case 'name-asc': {
          const da = displayNameMap.get(a) ?? a;
          const db = displayNameMap.get(b) ?? b;
          return da.localeCompare(db);
        }
        case 'name-desc': {
          const da = displayNameMap.get(a) ?? a;
          const db = displayNameMap.get(b) ?? b;
          return db.localeCompare(da);
        }
        case 'created-asc': {
          const ta = timestampMap.get(a) ?? '';
          const tb = timestampMap.get(b) ?? '';
          return ta.localeCompare(tb);
        }
        case 'created-desc': {
          const ta = timestampMap.get(a) ?? '';
          const tb = timestampMap.get(b) ?? '';
          return tb.localeCompare(ta);
        }
        default:
          return 0;
      }
    });
  }, [filteredNames, sortMode, displayNameMap, timestampMap]);

  const groups = useMemo<GroupEntry[]>(() => {
    if (groupMode === 'none') return [];

    if (groupMode === 'purpose') {
      const byPurpose = new Map<string, string[]>();
      for (const name of sortedNames) {
        const landscape = purposeMap.get(name);
        const key = landscape && isKnownLandscape(landscape) ? landscape : '';
        if (!byPurpose.has(key)) byPurpose.set(key, []);
        byPurpose.get(key)!.push(name);
      }
      const result: GroupEntry[] = [];
      for (const purpose of PURPOSE_ORDER) {
        const names = byPurpose.get(purpose);
        if (names && names.length > 0) {
          result.push({ key: purpose, label: t(`SupportInfo.landscape.${purpose}`), names });
        }
      }
      const unset = byPurpose.get('');
      if (unset && unset.length > 0) {
        result.push({ key: 'unset', label: t('ProjectsListView.groupUnset'), names: unset });
      }
      return result;
    }

    if (groupMode === 'chargingTarget') {
      const byTarget = new Map<string, string[]>();
      for (const name of sortedNames) {
        const key = chargingTargetMap.get(name) ?? '';
        if (!byTarget.has(key)) byTarget.set(key, []);
        byTarget.get(key)!.push(name);
      }
      const keys = [...byTarget.keys()].sort((a, b) => a.localeCompare(b));
      return keys.map((key) => ({
        key: key || 'unset',
        label: key || t('ProjectsListView.groupUnset'),
        names: byTarget.get(key)!,
      }));
    }

    // groupMode === 'created': group by "Month YYYY"
    const byDate = new Map<string, string[]>();
    for (const name of sortedNames) {
      const ts = timestampMap.get(name);
      const key = ts ? new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'long' }) : 'unknown';
      if (!byDate.has(key)) byDate.set(key, []);
      byDate.get(key)!.push(name);
    }
    const dateKeys = [...byDate.keys()].sort((a, b) => {
      const tsA = sortedNames.find((n) => byDate.get(a)?.includes(n));
      const tsB = sortedNames.find((n) => byDate.get(b)?.includes(n));
      const dA = tsA ? (timestampMap.get(tsA) ?? '') : '';
      const dB = tsB ? (timestampMap.get(tsB) ?? '') : '';
      return dB.localeCompare(dA);
    });
    return dateKeys.map((key) => ({
      key,
      label: key === 'unknown' ? t('ProjectsListView.groupUnknownYear') : key,
      names: byDate.get(key)!,
    }));
  }, [groupMode, sortedNames, purposeMap, timestampMap, chargingTargetMap, t]);

  const groupKeys = useMemo(() => groups.map((g) => g.key), [groups]);
  useEffect(() => {
    onGroupKeysChanged?.(groupKeys);
  }, [groupKeys, onGroupKeysChanged]);

  const hasData = purposeMap.size > 0 || timestampMap.size > 0 || chargingTargetMap.size > 0 || displayNameMap.size > 0;
  const canGroup = groupMode === 'none' || (hasData && groups.length > 1);

  const renderCard = (name: string) => (
    <ProjectCard
      key={name}
      projectName={name}
      setAsDefaultRef={setAsDefaultRef}
      useProjectMembers={useProjectMembers}
      onChargingTargetResolved={handleChargingTargetResolved}
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
          <div className={workspaceStyles.grid}>{sortedNames.map(renderCard)}</div>
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
