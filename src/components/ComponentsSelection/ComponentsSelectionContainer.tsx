import React, { useEffect, useState } from 'react';
import { ComponentsSelection } from './ComponentsSelection.tsx';

import IllustratedError from '../Shared/IllustratedError.tsx';
import { sortVersions } from '../../utils/componentsVersions.ts';

import { ListManagedComponents } from '../../lib/api/types/crate/listManagedComponents.ts';
import useApiResource from '../../lib/api/useApiResource.ts';
import Loading from '../Shared/Loading.tsx';
import {
  ManagedComponent,
  SelectedComponent,
} from '../../lib/api/types/crate/createManagedControlPlane.ts';

export interface ComponentsSelectionProps {
  selectedComponents: SelectedComponent[];
  setSelectedComponents: React.Dispatch<
    React.SetStateAction<SelectedComponent[]>
  >;
}
export const ComponentsSelectionContainer: React.FC<
  ComponentsSelectionProps
> = ({ setSelectedComponents, selectedComponents }) => {
  const [allComponents, setAllComponents] = useState<ManagedComponent[]>([]);
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

    setAllComponents(
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
  }, [allManagedComponents, isReady, setAllComponents]);
  if (isLoading) {
    return <Loading />;
  }
  if (error) return <IllustratedError />;
  return (
    <>
      {selectedComponents.length > 0 ? (
        <ComponentsSelection
          allComponents={allComponents}
          selectedComponents={selectedComponents}
          setSelectedComponents={setSelectedComponents}
        />
      ) : (
        <IllustratedError title={'Cannot load components list'} />
      )}
    </>
  );
};
