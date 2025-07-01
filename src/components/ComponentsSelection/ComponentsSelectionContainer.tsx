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
  setSelectedComponents: React.Dispatch<
    React.SetStateAction<ComponentSelectionItem[]>
  >;
}
export const ComponentsSelectionContainer: React.FC<
  ComponentsSelectionProps
> = ({ setSelectedComponents, selectedComponents }) => {
  const {
    data: allManagedComponents,
    error,
    isLoading,
  } = useApiResource(ListManagedComponents());
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    if (
      allManagedComponents?.items.length === 0 ||
      !allManagedComponents?.items ||
      isReady
    )
      return;

    setSelectedComponents(
      allManagedComponents?.items?.map((item) => {
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
  }, [allManagedComponents, isReady, setSelectedComponents]);
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
