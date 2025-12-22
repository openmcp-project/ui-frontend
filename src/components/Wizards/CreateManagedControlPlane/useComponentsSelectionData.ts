import { useEffect, useState } from 'react';
import { ManagedControlPlaneTemplate } from '../../../lib/api/types/templates/mcpTemplate.ts';
import { ComponentsListItem, removeComponents } from '../../../lib/api/types/crate/createManagedControlPlane.ts';
import { sortVersions } from '../../../utils/componentsVersions.ts';
import { useComponentsQuery as _useComponentsQuery } from '../../../hooks/useComponentsQuery.ts';
import { ManagedComponent } from '../../../lib/api/types/crate/listManagedComponents.ts';

export type ComponentsHookResult = {
  isLoading: boolean;
  error: unknown;
  templateDefaultsError: string | null;
};

export type InitialSelection = Record<string, { isSelected: boolean; version: string }>;

export type DefaultComponent = {
  name: string;
  version?: string;
};

export const isProviderComponent = (name: string): boolean => {
  return name.includes('provider') && name !== 'crossplane';
};

// Checks both exact name and without 'provider-' prefix
export const findInitialSelection = (
  name: string,
  initialSelection: InitialSelection | undefined,
): { isSelected: boolean; version: string } | undefined => {
  if (!initialSelection) return undefined;
  return initialSelection[name] ?? initialSelection[name.replace('provider-', '')];
};

export const findTemplateDefault = (
  name: string,
  selectedTemplate: ManagedControlPlaneTemplate | undefined,
): DefaultComponent | undefined => {
  return selectedTemplate?.spec?.spec?.components?.defaultComponents?.find((dc) => dc.name === name);
};

// Priority: initial selection > template default > first available version
export const determineSelectedVersion = (
  versions: string[],
  initSel: { isSelected: boolean; version: string } | undefined,
  templateDefault: DefaultComponent | undefined,
): string => {
  if (initSel?.version && versions.includes(initSel.version)) {
    return initSel.version;
  }

  if (!initSel && templateDefault?.version && versions.includes(templateDefault.version)) {
    return templateDefault.version;
  }

  if (!initSel && !templateDefault) {
    return versions[0] ?? '';
  }

  return '';
};

export const determineIsSelected = (
  initSel: { isSelected: boolean; version: string } | undefined,
  templateDefault: DefaultComponent | undefined,
): boolean => {
  if (initSel) {
    return Boolean(initSel.isSelected);
  }
  return Boolean(templateDefault);
};

export const mapToComponentsListItem = (
  item: ManagedComponent,
  initialSelection: InitialSelection | undefined,
  selectedTemplate: ManagedControlPlaneTemplate | undefined,
): ComponentsListItem => {
  const rawVersions = Array.isArray(item.status?.versions) ? (item.status?.versions as string[]) : [];
  const versions = sortVersions(rawVersions);
  const name = item.metadata?.name ?? '';

  const initSel = findInitialSelection(name, initialSelection);
  const templateDefault = findTemplateDefault(name, selectedTemplate);

  const isSelected = determineIsSelected(initSel, templateDefault);
  const selectedVersion = determineSelectedVersion(versions, initSel, templateDefault);

  return {
    name,
    versions,
    selectedVersion,
    isSelected,
    documentationUrl: '',
    isProvider: isProviderComponent(name),
  };
};

export const filterRemovedComponents = (components: ComponentsListItem[]): ComponentsListItem[] => {
  return components.filter((component) => !removeComponents.includes(component.name));
};

// Adds providers from initial selection that don't exist in the available components list
export const addCustomProviders = (
  componentsList: ComponentsListItem[],
  initialSelection: InitialSelection | undefined,
): ComponentsListItem[] => {
  if (!initialSelection) return componentsList;

  const result = [...componentsList];
  const existingNames = new Set(result.map((c) => c.name));

  Object.entries(initialSelection).forEach(([name, selection]) => {
    const hasExactMatch = existingNames.has(name);
    const hasProviderPrefixMatch = existingNames.has(`provider-${name}`);

    if (!hasExactMatch && !hasProviderPrefixMatch && selection.isSelected && selection.version) {
      result.push({
        name,
        versions: [selection.version],
        selectedVersion: selection.version,
        isSelected: true,
        documentationUrl: '',
        isProvider: true,
      });
    }
  });

  return result;
};

// Sorts: non-providers alphabetically, then providers after 'crossplane'
export const sortComponents = (componentsList: ComponentsListItem[]): ComponentsListItem[] => {
  const nonProviders = componentsList.filter((c) => !c.isProvider).sort((a, b) => a.name.localeCompare(b.name));

  const crossplaneProviders = componentsList.filter((c) => c.isProvider).sort((a, b) => a.name.localeCompare(b.name));

  const crossplaneIndex = nonProviders.findIndex((c) => c.name === 'crossplane');
  const insertIndex = crossplaneIndex !== -1 ? crossplaneIndex + 1 : nonProviders.length;

  return [...nonProviders.slice(0, insertIndex), ...crossplaneProviders, ...nonProviders.slice(insertIndex)];
};

export const buildComponentsList = (
  items: ManagedComponent[],
  initialSelection: InitialSelection | undefined,
  selectedTemplate: ManagedControlPlaneTemplate | undefined,
): ComponentsListItem[] => {
  if (!items || items.length === 0) {
    return [];
  }

  const mappedComponents = items.map((item) => mapToComponentsListItem(item, initialSelection, selectedTemplate));
  const filteredComponents = filterRemovedComponents(mappedComponents);
  const withCustomProviders = addCustomProviders(filteredComponents, initialSelection);

  return sortComponents(withCustomProviders);
};

export const validateTemplateDefaults = (
  items: ManagedComponent[],
  selectedTemplate: ManagedControlPlaneTemplate | undefined,
): string | null => {
  const defaults = selectedTemplate?.spec?.spec?.components?.defaultComponents ?? [];

  if (!items.length || !defaults.length) {
    return null;
  }

  const errors: string[] = [];

  defaults.forEach((dc) => {
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

  return errors.length ? errors.join('\n') : null;
};

export const useComponentsSelectionData = (
  selectedTemplate: ManagedControlPlaneTemplate | undefined,
  initialSelection: InitialSelection | undefined,
  setValue: (name: 'componentsList', value: ComponentsListItem[], options?: { shouldValidate?: boolean }) => void,
  onComponentsInitialized?: (components: ComponentsListItem[]) => void,
  useComponentsQuery: typeof _useComponentsQuery = _useComponentsQuery,
): ComponentsHookResult => {
  const { components: data, error, isLoading } = useComponentsQuery();

  useEffect(() => {
    const items = data?.items ?? [];
    const sortedList = buildComponentsList(items, initialSelection, selectedTemplate);

    setValue('componentsList', sortedList, { shouldValidate: false });

    if (onComponentsInitialized && sortedList.length > 0) {
      onComponentsInitialized(sortedList);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(data?.items), selectedTemplate, initialSelection]);

  const [defaultsError, setDefaultsError] = useState<string | null>(null);

  useEffect(() => {
    const items = data?.items ?? [];
    const error = validateTemplateDefaults(items, selectedTemplate);
    setDefaultsError(error);
  }, [data, selectedTemplate]);

  return { isLoading: Boolean(isLoading), error, templateDefaultsError: defaultsError };
};
