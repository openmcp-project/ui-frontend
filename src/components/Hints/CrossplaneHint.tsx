import React from 'react';
import { GenericHint } from './GenericHint';
import { useCrossplaneHintConfig } from './hintConfigs';
import { GenericHintProps } from './types';

// New modular CrossplaneHint using the generic component
export const CrossplaneHint: React.FC<Omit<GenericHintProps, 'config'>> = (props) => {
  const config = useCrossplaneHintConfig();
  return <GenericHint {...props} config={config} />;
};
