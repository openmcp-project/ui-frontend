import { ReactNode } from 'react';
import { APIError } from '../../lib/api/error';
import { ManagedResourceItem } from '../../lib/shared/types';
import { PercentageSegment } from '../Shared/MultiPercentageBar';

export interface HintSegmentCalculator {
  (allItems: ManagedResourceItem[], isLoading: boolean, error: APIError | undefined, enabled: boolean): HintState;
}

export interface HintState {
  segments: PercentageSegment[];
  label: string;
  showPercentage: boolean;
  isHealthy: boolean;
  showOnlyNonZero?: boolean;
}

export interface HintConfig {
  title: string;
  subtitle: string;
  iconSrc: string;
  iconAlt: string;
  iconStyle?: React.CSSProperties;
  scrollTarget?: string;
  calculateSegments: HintSegmentCalculator;
  renderHoverContent?: (allItems: ManagedResourceItem[], enabled: boolean) => ReactNode;
}

export interface GenericHintProps {
  enabled?: boolean;
  version?: string;
  onActivate?: () => void;
  allItems?: ManagedResourceItem[];
  isLoading?: boolean;
  error?: APIError;
  config: HintConfig;
}
