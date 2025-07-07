import React, { useEffect, useState } from 'react';
import { ComponentsSelection } from './ComponentsSelection.tsx';

import IllustratedError from '../Shared/IllustratedError.tsx';
import { sortVersions } from '../../utils/componentsVersions.ts';

import { ListManagedComponents } from '../../lib/api/types/crate/listManagedComponents.ts';
import useApiResource from '../../lib/api/useApiResource.ts';
import Loading from '../Shared/Loading.tsx';
import { ComponentsListItem } from '../../lib/api/types/crate/createManagedControlPlane.ts';
import { useTranslation } from 'react-i18next';

export interface ComponentsSelectionProps {
  componentsList: ComponentsListItem[];
  setComponentsList: (components: ComponentsListItem[]) => void;
}

// get selected components and when Crossplane is selected then also providers
export const getSelectedComponents = (components: ComponentsListItem[]) =>
  components.filter(
    (component) =>
      component.isSelected &&
      !(
        component.name?.includes('provider') &&
        components?.find(({ name }) => name === 'crossplane')?.isSelected ===
          false
      ),
  );

export const ComponentsSelectionContainer: React.FC<
  ComponentsSelectionProps
> = ({ setComponentsList, componentsList }) => {
  const {
    data: availableManagedComponentsListData,
    error,
    isLoading,
  } = useApiResource(ListManagedComponents());
  const [isReady, setIsReady] = useState(false);
  const { t } = useTranslation();
  useEffect(() => {
    if (
      availableManagedComponentsListData?.items.length === 0 ||
      !availableManagedComponentsListData?.items ||
      isReady
    )
      return;

    setComponentsList(
      availableManagedComponentsListData?.items?.map((item) => {
        const versions = sortVersions(item.status.versions);
        return {
          name: item.metadata.name,
          versions: versions,
          selectedVersion: versions[0],
          isSelected: false,
          documentationUrl: '',
        };
      }) ?? [],
    );
    setIsReady(true);
  }, [availableManagedComponentsListData, isReady, setComponentsList]);
  if (isLoading) {
    return <Loading />;
  }
  if (error) return <IllustratedError />;
  return (
    <>
      {componentsList.length > 0 ? (
        <ComponentsSelection
          componentsList={componentsList}
          setComponentsList={setComponentsList}
        />
      ) : (
        <IllustratedError title={t('componentsSelection.cannotLoad')} />
      )}
    </>
  );
};
