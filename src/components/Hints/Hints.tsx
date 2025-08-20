import { FlexBox, FlexBoxDirection } from '@ui5/webcomponents-react';
import { CrossplaneHint } from './CrossplaneHint';
import { GitOpsHint } from './GitOpsHint';
import { VaultHint } from './VaultHint';

import { ControlPlaneType } from '../../lib/api/types/crate/controlPlanes';

import React from 'react';

interface HintsProps {
    mcp: ControlPlaneType;
}

const Hints: React.FC<HintsProps> = ({ mcp }) => (
    <FlexBox
        direction={FlexBoxDirection.Row}
        style={{
            gap: '12px',
            justifyContent: 'space-between',
            alignItems: 'stretch',
            width: '100%'
        }}
    >
        <CrossplaneHint enabled={!!mcp?.spec?.components?.crossplane} />
        <GitOpsHint enabled={!!mcp?.spec?.components?.flux} />
        <VaultHint enabled={!!mcp?.spec?.components?.externalSecretsOperator} />
    </FlexBox>
);

export default Hints;
