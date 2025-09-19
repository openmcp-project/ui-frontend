import { ReactNode } from 'react';
import { APIError } from '../lib/api/error';
import { PercentageSegment } from '../components/BentoGrid/MultiPercentageBar/MultiPercentageBar';

export interface GenericHintSegmentCalculator<T = unknown> {
  (
    allItems: T[],
    isLoading: boolean,
    error: APIError | undefined,
    enabled: boolean,
    t: (key: string) => string,
  ): GenericHintState;
}

export interface GenericHintState {
  segments: PercentageSegment[];
  label: string;
  showPercentage: boolean;
  isHealthy: boolean;
  showOnlyNonZero?: boolean;
}

export interface GenericHintConfig<T = unknown> {
  title: string;
  subtitle: string;
  iconSrc: string;
  iconAlt: string;
  iconStyle?: React.CSSProperties;
  scrollTarget?: string;
  calculateSegments: GenericHintSegmentCalculator<T>;
  renderHoverContent?: (allItems: T[], enabled: boolean) => ReactNode;
}

export interface GenericHintProps<T = unknown> {
  enabled?: boolean;
  version?: string;
  onActivate?: () => void;
  allItems?: T[];
  isLoading?: boolean;
  error?: APIError;
  config: GenericHintConfig<T>;
  height?: string | number;
}
