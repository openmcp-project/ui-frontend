import React from 'react';
import { GenericHint } from './GenericHint';
import { useGitOpsHintConfig } from './hintConfigs';
import { GenericHintProps } from './types';

// New modular GitOpsHint using the generic component
export const GitOpsHint: React.FC<Omit<GenericHintProps, 'config'>> = (props) => {
  const config = useGitOpsHintConfig();
  return <GenericHint {...props} config={config} />;
};
