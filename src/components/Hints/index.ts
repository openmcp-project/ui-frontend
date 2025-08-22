// Main components
export { default } from './Hints';
export { GenericHint } from './GenericHint';

// Hover content components
export { CrossplaneHoverContent } from './CrossplaneHoverContent';
export { LegendSection } from './LegendSection';

// Configuration hooks
export { 
  useCrossplaneHintConfig, 
  useGitOpsHintConfig, 
  useVaultHintConfig 
} from './hintConfigs';

// Calculation utilities
export { 
  calculateCrossplaneSegments, 
  calculateGitOpsSegments, 
  calculateVaultSegments,
  calculateCrossplaneHoverData,
  HINT_COLORS 
} from './calculations';

// Utility functions
export { flattenManagedResources } from './Hints';

// Types
export type { 
  HintConfig, 
  HintState, 
  HintSegmentCalculator, 
  GenericHintProps 
} from './types';

export type { 
  ResourceTypeStats, 
  OverallStats, 
  CrossplaneHoverData 
} from './calculations';

// Styles
export { default as styles } from './Hints.module.css';
