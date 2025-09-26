import { useEffect, useState } from 'react';
import { ManagedControlPlaneTemplate } from '../../../lib/api/types/templates/mcpTemplate.ts';
import { ComponentsListItem, removeComponents } from '../../../lib/api/types/crate/createManagedControlPlane.ts';
import { useApiResource } from '../../../lib/api/useApiResource.ts';
import { ListManagedComponents } from '../../../lib/api/types/crate/listManagedComponents.ts';
import { sortVersions } from '../../../utils/componentsVersions.ts';

export type ComponentsHookResult = {
  isLoading: boolean;
  error: unknown;
  templateDefaultsError: string | null;
};

export const useComponentsSelectionData = (
  selectedTemplate: ManagedControlPlaneTemplate | undefined,
  initialSelection: Record<string, { isSelected: boolean; version: string }> | undefined,
  isOnMcpPage: boolean,
  setValue: (name: 'componentsList', value: ComponentsListItem[], options?: { shouldValidate?: boolean }) => void,
  onComponentsInitialized?: (components: ComponentsListItem[]) => void,
): ComponentsHookResult => {
  const { data, error, isLoading } = useApiResource(ListManagedComponents(), undefined, !!isOnMcpPage);

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
        } as ComponentsListItem;
      })
      .filter((component) => !removeComponents.find((item) => item === component.name));

    setValue('componentsList', newComponentsList, { shouldValidate: false });
    if (onComponentsInitialized) {
      onComponentsInitialized(newComponentsList);
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
