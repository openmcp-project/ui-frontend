import React, { useEffect } from 'react';
import {
  ComponentSelectionItem,
  ComponentsSelection,
} from './ComponentsSelection.tsx';

import IllustratedError from '../Shared/IllustratedError.tsx';
import { sortVersions } from '../../utils/componentsVersions.ts';

export interface ComponentItem {
  name: string;
  versions: string[];
}

export interface ComponentsSelectionProps {
  selectedComponents: ComponentSelectionItem[];
  setSelectedComponents: React.Dispatch<
    React.SetStateAction<ComponentSelectionItem[]>
  >;
}
export const ComponentsSelectionContainer: React.FC<
  ComponentsSelectionProps
> = ({ setSelectedComponents, selectedComponents }) => {
  const mockedItems: ComponentItem[] = [
    { name: 'cert-manager', versions: ['1.13.1', '1.16.1'] },
    {
      name: 'crossplane',
      versions: [
        '1.15.0',
        '1.15.5',
        '1.16.0',
        '1.16.1',
        '1.16.2',
        '1.17.0',
        '1.17.1',
        '1.17.2',
        '1.17.3',
        '1.18.0',
        '1.18.1',
        '1.18.2',
        '1.18.3',
        '1.19.0',
      ],
    },
    {
      name: 'external-secrets',
      versions: [
        '0.10.7',
        '0.11.0',
        '0.12.1',
        '0.13.0',
        '0.14.4',
        '0.15.1',
        '0.16.2',
        '0.17.0',
        '0.8.0',
      ],
    },
    { name: 'flux', versions: ['2.12.4', '2.13.0', '2.14.0', '2.15.0'] },
    { name: 'kyverno', versions: ['3.2.4'] },
    { name: 'provider-argocd', versions: ['0.8.0', '0.8.1', '0.9.0', '0.9.1'] },
    { name: 'provider-avs', versions: ['0.1.1', '0.2.0', '0.3.0'] },
    {
      name: 'provider-btp',
      versions: ['1.0.0', '1.0.1', '1.0.2', '1.0.3', '1.1.0', '1.1.1', '1.1.2'],
    },
    { name: 'provider-btp-account', versions: ['0.7.5', '0.7.6'] },
    { name: 'provider-cloudfoundry', versions: ['2.2.3', '2.2.4', '2.2.5'] },
    { name: 'provider-cloudfoundry-opensource', versions: ['0.3.0'] },
    { name: 'provider-destinations', versions: ['1.0.3'] },
    { name: 'provider-dynatrace', versions: ['1.1.2', '1.1.3'] },
    { name: 'provider-gardener-auth', versions: ['0.0.4', '0.0.6'] },
    { name: 'provider-hana', versions: ['0.1.0'] },
    { name: 'provider-helm', versions: ['0.19.0'] },
    {
      name: 'provider-hyperscaler',
      versions: ['0.0.1', '0.0.2', '0.0.3', '0.0.4'],
    },
    { name: 'provider-ias', versions: ['0.2.0', '0.2.1', '0.2.2', '0.2.3'] },
    { name: 'provider-kubernetes', versions: ['0.14.0', '0.14.1', '0.15.0'] },
    { name: 'provider-message-queue', versions: ['1.0.1'] },
    { name: 'provider-onboarding-experimental', versions: ['0.0.3'] },
    { name: 'provider-terraform', versions: ['0.16.0'] },
    { name: 'provider-vault', versions: ['1.0.0'] },
    {
      name: 'sap-btp-service-operator',
      versions: [
        '0.5.4',
        '0.6.0',
        '0.6.1',
        '0.6.2',
        '0.6.3',
        '0.6.4',
        '0.6.5',
        '0.6.6',
        '0.6.8',
      ],
    },
    { name: 'velero', versions: ['7.1.0'] },
  ];

  useEffect(() => {
    if (mockedItems.length === 0) return;

    setSelectedComponents(
      mockedItems.map((item) => {
        const versions = sortVersions(item.versions);
        return {
          name: item.name,
          versions: versions,
          selectedVersion: versions[0],
          isSelected: false,
        };
      }),
    );
  }, []);
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
