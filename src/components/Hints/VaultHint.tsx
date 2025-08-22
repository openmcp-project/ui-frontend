import React from 'react';
import { GenericHint } from './GenericHint';
import { useVaultHintConfig } from './hintConfigs';
import { GenericHintProps } from './types';

// New modular VaultHint using the generic component
export const VaultHint: React.FC<Omit<GenericHintProps, 'config'>> = (props) => {
  const config = useVaultHintConfig();
  return <GenericHint {...props} config={config} />;
};
