import { useEffect, useState } from 'react';
import { ManagedControlPlaneTemplate } from '../../../lib/api/types/templates/mcpTemplate.ts';
import { ComponentsListItem, removeComponents } from '../../../lib/api/types/crate/createManagedControlPlane.ts';
import { sortVersions } from '../../../utils/componentsVersions.ts';
import { useComponentsQuery as _useComponentsQuery } from '../../../hooks/useComponentsQuery.ts';

export type ComponentsHookResult = {
  isLoading: boolean;
  error: unknown;
  templateDefaultsError: string | null;
};

export const useComponentsSelectionData = (
  selectedTemplate: ManagedControlPlaneTemplate | undefined,
  initialSelection: Record<string, { isSelected: boolean; version: string }> | undefined,
  setValue: (name: 'componentsList', value: ComponentsListItem[], options?: { shouldValidate?: boolean }) => void,
  onComponentsInitialized?: (components: ComponentsListItem[]) => void,
  useComponentsQuery: typeof _useComponentsQuery = _useComponentsQuery,
): ComponentsHookResult => {
  const { components: data, error, isLoading } = useComponentsQuery();

  useEffect(() => {
    const items = data?.items ?? [];
    if (!items || items.length === 0) {
      setValue('componentsList', [], { shouldValidate: false });
      return;
    }
    const newComponentsList: ComponentsListItem[] = items
      .map((item) => {
        const rawVersions = Array.isArray(item.status?.versions) ? (item.status?.versions as string[]) : [];
        const versions = sortVersions(rawVersions);
        const name = item.metadata?.name ?? '';
        const initSel = initialSelection?.[name];
        const templateDefault = selectedTemplate?.spec?.spec?.components?.defaultComponents?.find(
          (dc) => dc.name === name,
        );
        let isSelected = Boolean(initSel?.isSelected);
        let selectedVersion = initSel?.version && versions.includes(initSel.version) ? initSel.version : '';
        if (!initSel) {
          isSelected = Boolean(templateDefault);
          const templateVersion = templateDefault?.version;
          selectedVersion = templateVersion && versions.includes(templateVersion) ? templateVersion : '';
        }
        if (!initSel && !templateDefault) {
          selectedVersion = versions[0] ?? '';
        }
        return {
          name,
          versions,
          selectedVersion,
          isSelected,
          documentationUrl: '',
          isProvider: name.includes('provider') && name !== 'crossplane',
        } as ComponentsListItem;
      })
      .filter((component) => !removeComponents.find((item) => item === component.name));

    // Add providers from initialSelection that don't exist in the available components list
    if (initialSelection) {
      const existingNames = new Set(newComponentsList.map((c) => c.name));
      Object.entries(initialSelection).forEach(([name, selection]) => {
        if (!existingNames.has(name) && selection.isSelected && selection.version) {
          newComponentsList.push({
            name,
            versions: [selection.version],
            selectedVersion: selection.version,
            isSelected: true,
            documentationUrl: '',
            isProvider: true,
          });
        }
      });
    }

    // Sort the components list: alphabetically, but providers come after 'crossplane'
    const components = newComponentsList.filter((c) => !c.isProvider).sort((a, b) => a.name.localeCompare(b.name));
    const providers = newComponentsList.filter((c) => c.isProvider).sort((a, b) => a.name.localeCompare(b.name));

    // Find crossplane index in nonProviders and insert providers after it
    const crossplaneIndex = components.findIndex((c) => c.name === 'crossplane');
    const sortedList =
      crossplaneIndex !== -1
        ? [...components.slice(0, crossplaneIndex + 1), ...providers, ...components.slice(crossplaneIndex + 1)]
        : [...components, ...providers];

    setValue('componentsList', sortedList, { shouldValidate: false });
    if (onComponentsInitialized) {
      onComponentsInitialized(sortedList);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(data?.items), selectedTemplate, initialSelection]);

  const [defaultsError, setDefaultsError] = useState<string | null>(null);
  useEffect(() => {
    const items = data?.items ?? [];
    const defaults = selectedTemplate?.spec?.spec?.components?.defaultComponents ?? [];
    if (!items.length || !defaults.length) {
      setDefaultsError(null);
      return;
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
    setDefaultsError(errors.length ? errors.join('\n') : null);
  }, [data, selectedTemplate]);

  return { isLoading: Boolean(isLoading), error, templateDefaultsError: defaultsError };
};
