import React from 'react';
import { ComponentsSelection } from './ComponentsSelection.tsx';
import IllustratedError from '../Shared/IllustratedError.tsx';
import Loading from '../Shared/Loading.tsx';
import type { ComponentsListItem } from '../../lib/api/types/crate/createManagedControlPlane.ts';
import * as mcp from '../../lib/api/types/crate/createManagedControlPlane.ts';
import { useTranslation } from 'react-i18next';

export interface ComponentsSelectionProps {
  componentsList: ComponentsListItem[];
  setComponentsList: (components: ComponentsListItem[]) => void;
  isLoading: boolean;
  error: unknown;
  templateDefaultsError?: string;
}

/**
 * Returns the selected components. If Crossplane is not selected,
 * provider components are excluded.
 */
export const getSelectedComponents = (components: ComponentsListItem[]) => {
  const isCrossplaneSelected = components.some(({ name, isSelected }) => name === 'crossplane' && isSelected);

  return components
    .filter(({ isSelected, name }) => isSelected && (isCrossplaneSelected || !name?.includes('provider')))
    .map((component) => {
      const mapping = mcp.replaceComponentsName.find((m) => m.replaceName === component.name);
      return {
        ...component,
        name: mapping ? mapping.originalName : component.name,
      };
    });
};

export const ComponentsSelectionContainer: React.FC<ComponentsSelectionProps> = ({
  setComponentsList,
  componentsList,
  isLoading,
  error,
  templateDefaultsError,
}) => {
  const { t } = useTranslation();

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <IllustratedError compact={true} />;
  }

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
