// Main components
export { default } from './Hints';
export { GenericHint } from './GenericHint';

// Hover content components
export { HoverContent } from './HoverContent';
export { LegendSection } from './LegendSection';

// Configuration hooks
export { useCrossplaneHintConfig, useGitOpsHintConfig, useVaultHintConfig } from './hintConfigs';

// Calculation utilities
export {
  calculateCrossplaneSegments,
  calculateGitOpsSegments,
  calculateVaultSegments,
  calculateCrossplaneHoverData,
  calculateCrossplaneHoverDataGeneric,
  calculateGitOpsHoverDataGeneric,
  HINT_COLORS,
} from './calculations';

// Utility functions
export { flattenManagedResources } from './Hints';

// Types
export type { HintConfig, HintState, HintSegmentCalculator, HoverDataCalculator, GenericHintProps } from './types';
export type { HoverContentProps, LegendItem, RadarDataPoint, RadarMeasure, RadarDimension } from './HoverContent';

export type { ResourceTypeStats, OverallStats, CrossplaneHoverData } from './calculations';

// Styles
export { default as styles } from './Hints.module.css';
