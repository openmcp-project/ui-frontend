import React, { useEffect, useState } from 'react';
import { ComponentsSelection } from './ComponentsSelection.tsx';

import IllustratedError from '../Shared/IllustratedError.tsx';
import { sortVersions } from '../../utils/componentsVersions.ts';

import { ListManagedComponents } from '../../lib/api/types/crate/listManagedComponents.ts';
import useApiResource from '../../lib/api/useApiResource.ts';
import Loading from '../Shared/Loading.tsx';
import { ComponentSelectionItem } from '../../lib/api/types/crate/createManagedControlPlane.ts';

export interface ComponentsSelectionProps {
  selectedComponents: ComponentSelectionItem[];
  setSelectedComponents: (components: ComponentSelectionItem[]) => void;
}

export const filterSelectedComponents = (
  components: ComponentSelectionItem[],
) =>
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
> = ({ setSelectedComponents, selectedComponents }) => {
  const {
    data: availableManagedComponentsListData,
    error,
    isLoading,
  } = useApiResource(ListManagedComponents());
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    if (
      availableManagedComponentsListData?.items.length === 0 ||
      !availableManagedComponentsListData?.items ||
      isReady
    )
      return;

    setSelectedComponents(
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
  }, [availableManagedComponentsListData, isReady, setSelectedComponents]);
  if (isLoading) {
    return <Loading />;
  }
  if (error) return <IllustratedError />;
  return (
    <>
      {selectedComponents.length > 0 ? (
        <ComponentsSelection
          components={selectedComponents}
          setSelectedComponents={setSelectedComponents}
        />
      ) : (
        <IllustratedError title={'Cannot load components list'} />
      )}
    </>
  );
};
