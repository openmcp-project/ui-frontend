import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ComponentsSelection } from './ComponentsSelection.tsx';

import IllustratedError from '../Shared/IllustratedError.tsx';
import { sortVersions } from '../../utils/componentsVersions.ts';

import { ListManagedComponents } from '../../lib/api/types/crate/listManagedComponents.ts';
import { useApiResource } from '../../lib/api/useApiResource.ts';
import Loading from '../Shared/Loading.tsx';
import { ComponentsListItem, removeComponents } from '../../lib/api/types/crate/createManagedControlPlane.ts';
import { useTranslation } from 'react-i18next';
import { ManagedControlPlaneTemplate } from '../../lib/api/types/templates/mcpTemplate.ts';

export interface ComponentsSelectionProps {
  componentsList: ComponentsListItem[];
  setComponentsList: (components: ComponentsListItem[]) => void;
  managedControlPlaneTemplate?: ManagedControlPlaneTemplate;
}

/**
 * Returns the selected components. If Crossplane is not selected,
 * provider components are excluded.
 */
export const getSelectedComponents = (components: ComponentsListItem[]) => {
  const isCrossplaneSelected = components.some(({ name, isSelected }) => name === 'crossplane' && isSelected);
  return components.filter((component) => {
    if (!component.isSelected) return false;
    if (component.name?.includes('provider') && !isCrossplaneSelected) {
      return false;
    }
    return true;
  });
};

type TemplateDefaultComponent = {
  name: string;
  version: string;
  removable?: boolean;
  versionChangeable?: boolean;
};

export const ComponentsSelectionContainer: React.FC<ComponentsSelectionProps> = ({
  setComponentsList,
  componentsList,
  managedControlPlaneTemplate,
}) => {
  const { data: availableManagedComponentsListData, error, isLoading } = useApiResource(ListManagedComponents());
  const { t } = useTranslation();
  const initialized = useRef(false);
  const [templateDefaultsError, setTemplateDefaultsError] = useState<string | null>(null);
  const defaultComponents = useMemo<TemplateDefaultComponent[]>(
    () => managedControlPlaneTemplate?.spec?.spec?.components?.defaultComponents ?? [],
    [managedControlPlaneTemplate],
  );

  useEffect(() => {
    const items = availableManagedComponentsListData?.items ?? [];

    if (!items.length) {
      if (!initialized.current) return;
      setTemplateDefaultsError(null);
      return;
    }

    if (!initialized.current) {
      const newComponentsList = items
        .map((item) => {
          const versions = sortVersions(item.status.versions);
          const template = defaultComponents.find((dc) => dc.name === item.metadata.name);
          const templateVersion = template?.version;
          const selectedVersion = template
            ? templateVersion && versions.includes(templateVersion)
              ? templateVersion
              : ''
            : (versions[0] ?? '');
          return {
            name: item.metadata.name,
            versions,
            selectedVersion,
            isSelected: !!template,
            documentationUrl: '',
          };
        })
        .filter((component) => !removeComponents.find((item) => item === component.name));

      setComponentsList(newComponentsList);
      initialized.current = true;
    }

    if (!defaultComponents.length) {
      setTemplateDefaultsError(null);
      return;
    }

    const errors: string[] = [];
    defaultComponents.forEach((dc: TemplateDefaultComponent) => {
      if (!dc?.name) return;
      const item = items.find((it) => it.metadata.name === dc.name);
      if (!item) {
        errors.push(`Component "${dc.name}" from template is not available.`);
        return;
      }
      const versions: string[] = Array.isArray(item.status?.versions) ? item.status.versions : [];
      if (dc.version && !versions.includes(dc.version)) {
        errors.push(`Component "${dc.name}" version "${dc.version}" from template is not available.`);
      }
    });

    setTemplateDefaultsError(errors.length ? errors.join('\n') : null);
  }, [availableManagedComponentsListData, defaultComponents, setComponentsList]);

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <IllustratedError compact={true} />;
  }

  // Defensive: If the API returned no items, show error
  if (!componentsList || componentsList.length === 0) {
    return <IllustratedError title={t('componentsSelection.cannotLoad')} compact={true} />;
  }

  return (
    <ComponentsSelection
      componentsList={componentsList}
      setComponentsList={setComponentsList}
      templateDefaultsError={templateDefaultsError || undefined}
    />
  );
};
