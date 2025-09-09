import React, { useEffect, useRef } from 'react';
import { ComponentsSelection } from './ComponentsSelection.tsx';

import IllustratedError from '../Shared/IllustratedError.tsx';
import { sortVersions } from '../../utils/componentsVersions.ts';

import { ListManagedComponents } from '../../lib/api/types/crate/listManagedComponents.ts';
import { useApiResource } from '../../lib/api/useApiResource.ts';
import Loading from '../Shared/Loading.tsx';
import { ComponentsListItem, removeComponents } from '../../lib/api/types/crate/createManagedControlPlane.ts';
import { useTranslation } from 'react-i18next';

export interface ComponentsSelectionProps {
  componentsList: ComponentsListItem[];
  setComponentsList: (components: ComponentsListItem[]) => void;
  initialSelection?: Record<string, { isSelected: boolean; version: string }>;
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

export const ComponentsSelectionContainer: React.FC<ComponentsSelectionProps> = ({
  setComponentsList,
  componentsList,
  initialSelection,
}) => {
  const { data: availableManagedComponentsListData, error, isLoading } = useApiResource(ListManagedComponents());
  const { t } = useTranslation();
  const initialized = useRef(false);

  useEffect(() => {
    if (
      initialized.current ||
      !availableManagedComponentsListData?.items ||
      availableManagedComponentsListData.items.length === 0
    ) {
      return;
    }

    let newComponentsList = availableManagedComponentsListData.items
      .map((item) => {
        const versions = sortVersions(item.status.versions);
        return {
          name: item.metadata.name,
          versions,
          selectedVersion: versions[0] ?? '',
          isSelected: false,
          documentationUrl: '',
        };
      })
      .filter((component) => !removeComponents.find((item) => item === component.name));

    // Apply initial selection when provided (edit mode)
    if (initialSelection) {
      newComponentsList = newComponentsList.map((component) => {
        const init = initialSelection[component.name];
        if (!init) return component;
        // Ensure selectedVersion exists in versions list; if not, keep as-is
        const selectedVersion = component.versions.includes(init.version) ? init.version : component.selectedVersion;
        return {
          ...component,
          isSelected: init.isSelected,
          selectedVersion,
        };
      });
    }

    setComponentsList(newComponentsList);
    initialized.current = true;
  }, [availableManagedComponentsListData, setComponentsList, initialSelection]);

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

  return <ComponentsSelection componentsList={componentsList} setComponentsList={setComponentsList} />;
};
