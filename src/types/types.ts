import { ReactNode } from 'react';
import { APIError } from '../lib/api/error';
import { ManagedResourceItem } from '../lib/shared/types';
import { PercentageSegment } from '../components/HintsCardsRow/MultiPercentageBar/MultiPercentageBar';
import { HoverContentProps } from '../components/HintsCardsRow/CardHoverContent/CardHoverContent';

export interface GenericHintSegmentCalculator {
  (
    allItems: ManagedResourceItem[],
    isLoading: boolean,
    error: APIError | undefined,
    enabled: boolean,
    t: (key: string) => string,
  ): GenericHintState;
}

export interface HoverDataCalculator {
  (
    allItems: ManagedResourceItem[],
    enabled: boolean,
    t: (key: string) => string,
  ): Omit<HoverContentProps, 'enabled'> | null;
}

export interface GenericHintState {
  segments: PercentageSegment[];
  label: string;
  showPercentage: boolean;
  isHealthy: boolean;
  showOnlyNonZero?: boolean;
}

export interface GenericHintConfig {
  title: string;
  subtitle: string;
  iconSrc: string;
  iconAlt: string;
  iconStyle?: React.CSSProperties;
  scrollTarget?: string;
  calculateSegments: GenericHintSegmentCalculator;
  calculateHoverData?: HoverDataCalculator;
  renderHoverContent?: (allItems: ManagedResourceItem[], enabled: boolean) => ReactNode;
}

export interface GenericHintProps {
  enabled?: boolean;
  version?: string;
  onActivate?: () => void;
  allItems?: ManagedResourceItem[];
  isLoading?: boolean;
  error?: APIError;
  config: GenericHintConfig;
}
