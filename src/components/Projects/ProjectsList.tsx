import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useRememberedProject } from '../../hooks/useRememberedProject.ts';
import { useTelemetry } from '../../lib/telemetry/telemetry.ts';
import { useProjectMembers as _useProjectMembers } from '../../spaces/onboarding/hooks/useProjectMembers';
import { useProjectsQuery as _useProjectsQuery } from '../../spaces/onboarding/hooks/useProjectsQuery';
import '@ui5/webcomponents-icons/dist/accept.js';
import '@ui5/webcomponents-icons/dist/account.js';
import '@ui5/webcomponents-icons/dist/badge.js';
import '@ui5/webcomponents-icons/dist/calendar.js';
import '@ui5/webcomponents-icons/dist/collapse-all.js';
import '@ui5/webcomponents-icons/dist/expand-all.js';
import '@ui5/webcomponents-icons/dist/group-2.js';
import '@ui5/webcomponents-icons/dist/sort-ascending.js';
import '@ui5/webcomponents-icons/dist/sort.js';
import {
  Button,
  ButtonDomRef,
  CheckBox,
  FlexBox,
  Menu,
  MenuItem,
  MenuSeparator,
  Ui5CustomEvent,
} from '@ui5/webcomponents-react';
import type { ButtonClickEventDetail } from '@ui5/webcomponents/dist/Button.js';
import type { MenuDomRef } from '@ui5/webcomponents-react';
import { t } from 'i18next';
import { ResourceSearchBar } from '../Shared/ResourceSearchBar.tsx';
import IllustratedError from '../Shared/IllustratedError.tsx';
import Loading from '../Shared/Loading.tsx';
import useLuigiNavigate from '../Shared/useLuigiNavigate.tsx';
import { FadeIn } from '../Ui/FadeIn/FadeIn.tsx';
import { GroupMode, ProjectsGrid, SortMode } from './ProjectsGrid.tsx';
import styles from './ProjectsList.module.css';

interface Props {
  useProjectsQuery?: typeof _useProjectsQuery;
  useProjectMembers?: typeof _useProjectMembers;
  onProjectSelect?: (projectName: string) => void;
}

export default function ProjectsList({
  useProjectsQuery = _useProjectsQuery,
  useProjectMembers = _useProjectMembers,
  onProjectSelect,
}: Props = {}) {
  const { t: tHook } = useTranslation();
  const navigate = useLuigiNavigate();
  const { data, error, isLoading } = useProjectsQuery();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [setAsDefault, setSetAsDefault] = useState(false);
  const setAsDefaultRef = useRef(false);

  const VALID_GROUP_MODES: GroupMode[] = ['none', 'purpose', 'chargingTarget', 'created'];
  const VALID_SORT_MODES: SortMode[] = ['name-asc', 'name-desc', 'created-asc', 'created-desc'];

  const groupMode: GroupMode = VALID_GROUP_MODES.includes(searchParams.get('group') as GroupMode)
    ? (searchParams.get('group') as GroupMode)
    : 'none';
  const sortMode: SortMode = VALID_SORT_MODES.includes(searchParams.get('sort') as SortMode)
    ? (searchParams.get('sort') as SortMode)
    : 'name-asc';

  const setGroupMode = useCallback(
    (mode: GroupMode) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (mode === 'none') next.delete('group');
        else next.set('group', mode);
        return next;
      });
    },
    [setSearchParams],
  );

  const setSortMode = useCallback(
    (mode: SortMode) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (mode === 'name-asc') next.delete('sort');
        else next.set('sort', mode);
        return next;
      });
    },
    [setSearchParams],
  );

  const [expandedGroups, setExpandedGroups] = useState<Set<string> | null>(null);
  const [groupMenuOpen, setGroupMenuOpen] = useState(false);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const groupMenuRef = useRef<MenuDomRef>(null);
  const sortMenuRef = useRef<MenuDomRef>(null);

  const telemetry = useTelemetry();
  const { setRememberedProject } = useRememberedProject();

  useEffect(() => {
    setAsDefaultRef.current = setAsDefault;
  }, [setAsDefault]);

  const hasFiredSearchedRef = useRef(false);
  const handleSearchChange = useCallback(
    (value: string) => {
      if (value === '' && hasFiredSearchedRef.current) {
        hasFiredSearchedRef.current = false;
      } else if (value !== '' && !hasFiredSearchedRef.current) {
        telemetry.track({ name: 'project-list.searched' });
        hasFiredSearchedRef.current = true;
      }
      setSearch(value);
    },
    [telemetry],
  );

  const filteredNames = useMemo(
    () => data?.filter((name) => !search || name.toLowerCase().includes(search.toLowerCase())) ?? [],
    [data, search],
  );

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== 'Enter') return;
      if (filteredNames.length === 1) {
        const projectName = filteredNames[0];
        if (setAsDefaultRef.current) {
          telemetry.track({ name: 'project-list.set-as-default', trigger: 'keyboard' });
          setRememberedProject(projectName);
        }
        onProjectSelect?.(projectName);
        navigate(`/projects/${projectName}`);
      } else if (filteredNames.length > 1) {
        telemetry.track({ name: 'project-list.search-enter-pressed' });
      }
    },
    [filteredNames, navigate, onProjectSelect, setRememberedProject, telemetry],
  );

  const groupKeysRef = useRef<string[]>([]);
  const handleGroupKeysChanged = useCallback((keys: string[]) => {
    groupKeysRef.current = keys;
  }, []);

  const handleExpandAll = useCallback(() => setExpandedGroups(null), []);
  const handleCollapseAll = useCallback(() => setExpandedGroups(new Set()), []);

  const handleToggleGroup = useCallback((groupKey: string) => {
    setExpandedGroups((prev) => {
      const allKeys = groupKeysRef.current;
      const currentExpanded = prev === null ? new Set(allKeys) : new Set(prev);
      if (currentExpanded.has(groupKey)) {
        currentExpanded.delete(groupKey);
      } else {
        currentExpanded.add(groupKey);
      }
      if (allKeys.length > 0 && allKeys.every((k) => currentExpanded.has(k))) {
        return null;
      }
      return currentExpanded;
    });
  }, []);

  const handleGroupButtonClick = useCallback((e: Ui5CustomEvent<ButtonDomRef, ButtonClickEventDetail>) => {
    if (groupMenuRef.current && e.currentTarget) {
      groupMenuRef.current.opener = e.currentTarget as HTMLElement;
      setGroupMenuOpen((prev) => !prev);
    }
  }, []);

  const handleSortButtonClick = useCallback((e: Ui5CustomEvent<ButtonDomRef, ButtonClickEventDetail>) => {
    if (sortMenuRef.current && e.currentTarget) {
      sortMenuRef.current.opener = e.currentTarget as HTMLElement;
      setSortMenuOpen((prev) => !prev);
    }
  }, []);

  if (isLoading) {
    return <Loading />;
  }
  if (error) {
    return <IllustratedError details={error.message} />;
  }

  const isGrouped = groupMode !== 'none';
  const allExpanded = expandedGroups === null;
  const sortLabel = {
    'name-asc': tHook('ProjectsListView.sortNameAsc'),
    'name-desc': tHook('ProjectsListView.sortNameDesc'),
    'created-desc': tHook('ProjectsListView.sortCreatedNewest'),
    'created-asc': tHook('ProjectsListView.sortCreatedOldest'),
  }[sortMode];
  const groupLabel = {
    none: tHook('ProjectsListView.groupNone'),
    purpose: tHook('ProjectsListView.groupByPurpose'),
    chargingTarget: tHook('ProjectsListView.groupByChargingTarget'),
    created: tHook('ProjectsListView.groupByCreated'),
  }[groupMode];

  return (
    <FadeIn>
      {data.length > 0 && (
        <FlexBox alignItems="Center" className={styles.searchBar} gap="0.5rem" justifyContent="SpaceBetween">
          <ResourceSearchBar value={search} onChange={handleSearchChange} onKeyDown={handleSearchKeyDown} />
          <FlexBox alignItems="Center" gap="0.5rem">
            {isGrouped &&
              (allExpanded ? (
                <Button
                  className={styles.expandCollapseButton}
                  design="Transparent"
                  disabled={!!search}
                  icon="collapse-all"
                  tooltip={tHook('ProjectsListView.collapseAll')}
                  onClick={handleCollapseAll}
                >
                  {tHook('ProjectsListView.collapseAll')}
                </Button>
              ) : (
                <Button
                  className={styles.expandCollapseButton}
                  design="Transparent"
                  disabled={!!search}
                  icon="expand-all"
                  tooltip={tHook('ProjectsListView.expandAll')}
                  onClick={handleExpandAll}
                >
                  {tHook('ProjectsListView.expandAll')}
                </Button>
              ))}
            <Button
              className={styles.expandCollapseButton}
              design="Transparent"
              icon="sort"
              tooltip={tHook('ProjectsListView.sortBy')}
              onClick={handleSortButtonClick}
            >
              {`${tHook('ProjectsListView.sortBy')}: ${sortLabel}`}
            </Button>
            <Menu
              ref={sortMenuRef}
              open={sortMenuOpen}
              onClose={() => setSortMenuOpen(false)}
              onItemClick={(e) => {
                const mode = (e.detail.item as HTMLElement).dataset['mode'] as SortMode | undefined;
                if (mode) {
                  setSortMode(mode);
                  setSortMenuOpen(false);
                }
              }}
            >
              <MenuItem
                data-mode="name-asc"
                icon={sortMode === 'name-asc' ? 'accept' : 'sort-ascending'}
                text={tHook('ProjectsListView.sortNameAsc')}
              />
              <MenuItem
                data-mode="name-desc"
                icon={sortMode === 'name-desc' ? 'accept' : 'sort-ascending'}
                text={tHook('ProjectsListView.sortNameDesc')}
              />
              <MenuSeparator />
              <MenuItem
                data-mode="created-desc"
                icon={sortMode === 'created-desc' ? 'accept' : 'calendar'}
                text={tHook('ProjectsListView.sortCreatedNewest')}
              />
              <MenuItem
                data-mode="created-asc"
                icon={sortMode === 'created-asc' ? 'accept' : 'calendar'}
                text={tHook('ProjectsListView.sortCreatedOldest')}
              />
            </Menu>
            <Button
              className={styles.expandCollapseButton}
              design={isGrouped ? 'Emphasized' : 'Transparent'}
              icon="group-2"
              tooltip={tHook('ProjectsListView.groupBy')}
              onClick={handleGroupButtonClick}
            >
              {`${tHook('ProjectsListView.groupBy')}: ${groupLabel}`}
            </Button>
            <Menu
              ref={groupMenuRef}
              open={groupMenuOpen}
              onClose={() => setGroupMenuOpen(false)}
              onItemClick={(e) => {
                const mode = (e.detail.item as HTMLElement).dataset['mode'] as GroupMode | undefined;
                if (mode) {
                  setGroupMode(mode);
                  setExpandedGroups(null);
                  setGroupMenuOpen(false);
                }
              }}
            >
              <MenuItem
                data-mode="none"
                icon={groupMode === 'none' ? 'accept' : ''}
                text={tHook('ProjectsListView.groupNone')}
              />
              <MenuItem
                data-mode="purpose"
                icon={groupMode === 'purpose' ? 'accept' : 'badge'}
                text={tHook('ProjectsListView.groupByPurpose')}
              />
              <MenuItem
                data-mode="chargingTarget"
                icon={groupMode === 'chargingTarget' ? 'accept' : 'account'}
                text={tHook('ProjectsListView.groupByChargingTarget')}
              />
              <MenuItem
                data-mode="created"
                icon={groupMode === 'created' ? 'accept' : 'calendar'}
                text={tHook('ProjectsListView.groupByCreated')}
              />
            </Menu>
          </FlexBox>
        </FlexBox>
      )}
      <ProjectsGrid
        expandedGroups={expandedGroups}
        groupMode={groupMode}
        projectNames={data ?? []}
        search={search}
        setAsDefaultRef={setAsDefaultRef}
        sortMode={sortMode}
        useProjectMembers={useProjectMembers}
        onGroupKeysChanged={handleGroupKeysChanged}
        onProjectSelect={onProjectSelect}
        onToggleGroup={handleToggleGroup}
      />
      <CheckBox
        checked={setAsDefault}
        text={t('ProjectsListView.setDefaultProject')}
        onChange={() => setSetAsDefault((v) => !v)}
      />
    </FadeIn>
  );
}
