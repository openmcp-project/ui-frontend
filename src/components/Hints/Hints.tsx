import { FlexBox, FlexBoxDirection } from '@ui5/webcomponents-react';
import { CrossplaneHint } from './CrossplaneHint';
import { GitOpsHint } from './GitOpsHint';
import { VaultHint } from './VaultHint';

import { ControlPlaneType } from '../../lib/api/types/crate/controlPlanes';
import { ManagedResourcesRequest } from '../../lib/api/types/crossplane/listManagedResources';
import { resourcesInterval } from '../../lib/shared/constants';
import { useApiResource } from '../../lib/api/useApiResource';
import React from 'react';

interface HintsProps {
    mcp: ControlPlaneType;
}


const Hints: React.FC<HintsProps> = ({ mcp }) => {
  const {
    data: managedResources,
    isLoading: managedResourcesLoading,
    error: managedResourcesError,
  } = useApiResource(ManagedResourcesRequest, {
    refreshInterval: resourcesInterval,
  });

  return (
    <FlexBox
      direction={FlexBoxDirection.Row}
      style={{
        gap: '12px',
        justifyContent: 'space-between',
        alignItems: 'stretch',
        width: '100%'
      }}
    >
      <CrossplaneHint
        enabled={!!mcp?.spec?.components?.crossplane}
        version={mcp?.spec?.components?.crossplane?.version}
        managedResources={managedResources}
        isLoading={managedResourcesLoading}
        error={managedResourcesError}
      />
      <GitOpsHint
        enabled={!!mcp?.spec?.components?.flux}
        version={mcp?.spec?.components?.flux?.version}
        managedResources={managedResources}
        isLoading={managedResourcesLoading}
        error={managedResourcesError}
      />
      <VaultHint
        enabled={!!mcp?.spec?.components?.externalSecretsOperator}
        version={mcp?.spec?.components?.externalSecretsOperator?.version}
        managedResources={managedResources}
        isLoading={managedResourcesLoading}
        error={managedResourcesError}
      />
    </FlexBox>
  );
};

export default Hints;
