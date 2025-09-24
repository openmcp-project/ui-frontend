import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useApiResource } from '../../lib/api/useApiResource.ts';
import { ListManagedComponents } from '../../lib/api/types/crate/listManagedComponents.ts';
import { sortVersions } from '../../utils/componentsVersions.ts';
import { ComponentsListItem, removeComponents } from '../../lib/api/types/crate/createManagedControlPlane.ts';
import { ManagedControlPlaneTemplate } from '../../lib/api/types/templates/mcpTemplate.ts';

export type ComponentsSelectionProviderProps = {
  componentsList: ComponentsListItem[];
  setComponentsList: (components: ComponentsListItem[]) => void;
  setInitialComponentsList: (components: ComponentsListItem[]) => void;
  managedControlPlaneTemplate?: ManagedControlPlaneTemplate;
  initialSelection?: Record<string, { isSelected: boolean; version: string }>;
  isOnMcpPage?: boolean;
  initializedComponents: React.RefObject<boolean>;
  children: React.ReactNode;
};

export type ComponentsSelectionContextValue = {
  isLoading: boolean;
  error: unknown;
  templateDefaultsError: string | null;
  hasInitialized: boolean;
};

const ComponentsSelectionContext = createContext<ComponentsSelectionContextValue | undefined>(undefined);

export const useComponentsSelection = (): ComponentsSelectionContextValue => {
  const ctx = useContext(ComponentsSelectionContext);
  if (!ctx) {
    throw new Error('useComponentsSelection must be used within ComponentsSelectionProvider');
  }
  return ctx;
};

export const ComponentsSelectionProvider: React.FC<ComponentsSelectionProviderProps> = ({
  componentsList,
  setComponentsList,
  setInitialComponentsList,
  managedControlPlaneTemplate,
  initialSelection,
  isOnMcpPage,
  initializedComponents,
  children,
}) => {
  type TemplateDefaultComponent = {
    name: string;
    version: string;
    removable?: boolean;
    versionChangeable?: boolean;
  };

  const {
    data: availableManagedComponentsListData,
    error,
    isLoading,
  } = useApiResource(ListManagedComponents(), undefined, !!isOnMcpPage);

  const [templateDefaultsError, setTemplateDefaultsError] = useState<string | null>(null);

  const defaultComponents = useMemo<TemplateDefaultComponent[]>(
    () => managedControlPlaneTemplate?.spec?.spec?.components?.defaultComponents ?? [],
    [managedControlPlaneTemplate],
  );

  // Initialize components list from API + template/defaults/initialSelection
  useEffect(() => {
    if (
      initializedComponents.current ||
      !availableManagedComponentsListData?.items ||
      availableManagedComponentsListData.items.length === 0
    ) {
    if (!availableManagedComponentsListData?.items) {
      return;
    }
    if (availableManagedComponentsListData.items.length === 0) {
      setInitialComponentsList([]);
      setComponentsList([]);
      initializedComponents.current = true;
      return;
    }
    const newComponentsList = availableManagedComponentsListData.items
      .map((item) => {
        const rawVersions = Array.isArray(item.status?.versions) ? (item.status?.versions as string[]) : [];
        const versions = sortVersions(rawVersions);
        const template = defaultComponents.find((dc) => dc.name === (item.metadata?.name ?? ''));
        const templateVersion = template?.version;
        let selectedVersion = template
          ? templateVersion && versions.includes(templateVersion)
            ? templateVersion
            : ''
          : (versions[0] ?? '');
        let isSelected = !!template;

        const initSel = initialSelection?.[item.metadata?.name ?? ''];
        if (initSel) {
          isSelected = Boolean(initSel.isSelected);
          selectedVersion = initSel.version && versions.includes(initSel.version) ? initSel.version : '';
        }
        return {
          name: item.metadata?.name ?? '',
          versions,
          selectedVersion,
          isSelected,
          documentationUrl: '',
        } as ComponentsListItem;
      })
      .filter((component) => !removeComponents.find((item) => item === component.name));

    setInitialComponentsList(newComponentsList);
    setComponentsList(newComponentsList);
    initializedComponents.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setComponentsList, defaultComponents, initialSelection, availableManagedComponentsListData?.items]);

  // Validate template default components are available
  useEffect(() => {
    const items = availableManagedComponentsListData?.items ?? [];
    if (items.length === 0 || !defaultComponents.length) {
      setTemplateDefaultsError(null);
      return;
    }
    const errors: string[] = [];
    defaultComponents.forEach((dc: TemplateDefaultComponent) => {
      if (!dc?.name) return;
      const item = items.find((it) => it.metadata?.name === dc.name);
      if (!item) {
        errors.push(`Component "${dc.name}" from template is not available.`);
        return;
      }
      const versions: string[] = Array.isArray(item.status?.versions) ? (item.status?.versions as string[]) : [];
      if (dc.version && !versions.includes(dc.version)) {
        errors.push(`Component "${dc.name}" version "${dc.version}" from template is not available.`);
      }
    });

    setTemplateDefaultsError(errors.length ? errors.join('\n') : null);
  }, [availableManagedComponentsListData, defaultComponents]);

  // Auto-apply template defaults if none selected and no initialSelection
  useEffect(() => {
    if (!initializedComponents.current) return;
    if (!defaultComponents?.length) return;
    if (!componentsList?.length) return;
    if (initialSelection && Object.keys(initialSelection).length > 0) return;
    const anySelected = componentsList.some((c) => c.isSelected);
    if (anySelected) return;

    const updated = componentsList.map((c) => {
      const template = defaultComponents.find((dc) => dc.name === c.name);
      if (!template) return c;
      const templateVersion = template.version;
      const safeVersions = Array.isArray(c.versions) ? c.versions : [];
      const selectedVersion = templateVersion && safeVersions.includes(templateVersion) ? templateVersion : '';
      return { ...c, isSelected: true, selectedVersion } as ComponentsListItem;
    });

    setComponentsList(updated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultComponents, componentsList, setComponentsList, initialSelection]);

  const value: ComponentsSelectionContextValue = {
    isLoading: Boolean(isLoading),
    error,
    templateDefaultsError,
    hasInitialized: Boolean(initializedComponents.current),
  };

  return <ComponentsSelectionContext.Provider value={value}>{children}</ComponentsSelectionContext.Provider>;
};
