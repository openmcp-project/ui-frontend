import React, { useMemo } from 'react';
import styles from './MultiPercentageBar.module.css';

/**
 * MultiPercentageBar - A configurable progress bar component with segments
 */

interface PercentageSegment {
  percentage: number;
  color: string;
  label: string;
  count?: number; // Optional count for displaying inside segments
  segmentLabel?: string; // Optional label to show inside the segment
  segmentLabelColor?: string; // Optional color for the segment label
}

type LabelPosition = 'above' | 'inside' | 'none';
type LabelDisplayMode = 'all' | 'primary' | 'custom';

interface LabelConfig {
  position: LabelPosition;
  displayMode: LabelDisplayMode;
  showPercentage?: boolean;
  showSegmentPercentage?: boolean; // Control segment label percentages independently
  showCount?: boolean;
  customLabels?: string[]; // Custom labels to show when displayMode is 'custom'
  primaryLabelText?: string; // Override primary label text
  primaryLabelValue?: string | number; // Arbitrary number/percentage to show after primary label
  fontSize?: string;
  fontWeight?: 'normal' | 'bold' | number;
  textColor?: string;
  healthyTextColor?: string; // Arbitrary color for healthy state (replaces hardcoded green)
  hideWhenSingleFull?: boolean; // Hide primary label when single segment is 100%
  segmentLabelFontSize?: string; // Font size for segment labels
  segmentLabelFontWeight?: 'normal' | 'bold' | number; // Font weight for segment labels
}

interface ColorConfig {
  overrides?: Record<string, string>; // Override colors by segment label
  healthyThreshold?: number; // Percentage threshold for healthy state
  useGradients?: boolean; // Whether to use gradient effects
  opacity?: number; // Overall opacity for segments
}

interface AnimationConfig {
  duration?: number;
  enableWave?: boolean;
  staggerDelay?: number; // Delay between segment animations
  enableTransitions?: boolean;
}

interface MultiPercentageBarProps {
  segments: PercentageSegment[];
  showOnlyNonZero?: boolean;
  isHealthy?: boolean; // Override for healthy state from parent component

  barWidth?: string;
  barMaxWidth?: string;
  barHeight?: string;
  gap?: string;
  borderRadius?: string;
  backgroundColor?: string;
  className?: string;
  style?: React.CSSProperties;

  labelConfig?: LabelConfig;
  colorConfig?: ColorConfig;
  animationConfig?: AnimationConfig;

  showSegmentLabels?: boolean;
  showSegmentLabelsOnHover?: boolean; 
  showLabels?: boolean; 
  minSegmentWidthForLabel?: number;
}

export const MultiPercentageBar: React.FC<MultiPercentageBarProps> = ({
  segments,
  showOnlyNonZero = true,
  isHealthy = false,
  barWidth = '80%',
  barMaxWidth = '400px',
  barHeight = '8px',
  gap = '2px',
  borderRadius = '6px',
  backgroundColor,
  className,
  style,
  labelConfig,
  colorConfig,
  animationConfig,
  showSegmentLabels = false,
  showSegmentLabelsOnHover = false,
  showLabels = false,
  minSegmentWidthForLabel = 15,
}) => {
  const mergedLabelConfig: LabelConfig = useMemo(
    () => ({
      position: 'above', // Always show above labels, segment labels are controlled separately
      displayMode: 'primary',
      showPercentage: false,
      showSegmentPercentage: true, // Default to showing percentages in segments
      showCount: false,
      fontSize: '0.875rem',
      fontWeight: 'normal',
      hideWhenSingleFull: false,
      healthyTextColor: '#28a745', // Default green, but now customizable
      segmentLabelFontSize: '0.75rem',
      segmentLabelFontWeight: 'normal',
      ...labelConfig,
    }),
    [labelConfig],
  );

  const mergedColorConfig: ColorConfig = useMemo(
    () => ({
      healthyThreshold: 100,
      useGradients: false,
      opacity: 1,
      ...colorConfig,
    }),
    [colorConfig],
  );

  const mergedAnimationConfig: AnimationConfig = useMemo(
    () => ({
      duration: 400,
      enableWave: true,
      staggerDelay: 100,
      enableTransitions: true,
      ...animationConfig,
    }),
    [animationConfig],
  );

  // Memoize filtered segments with color overrides
  const processedSegments = useMemo(() => {
    const filtered = showOnlyNonZero ? segments.filter((segment) => segment.percentage > 0) : segments;

    return filtered.map((segment) => ({
      ...segment,
      color: mergedColorConfig.overrides?.[segment.label] || segment.color,
    }));
  }, [segments, showOnlyNonZero, mergedColorConfig.overrides]);

  if (processedSegments.length === 0) {
    return null;
  }

  const primarySegment = processedSegments[0];
  const primaryPercentage = primarySegment?.percentage || 0;

  const shouldHidePrimaryLabel =
    mergedLabelConfig.hideWhenSingleFull && processedSegments.length === 1 && primaryPercentage === 100;

  // Helper function to render labels above the bar
  const renderAboveLabels = () => {
    if (mergedLabelConfig.position !== 'above') return null;

    const labelsToShow = [];

    switch (mergedLabelConfig.displayMode) {
      case 'primary':
        if (!shouldHidePrimaryLabel) {
          const displayText = mergedLabelConfig.primaryLabelText || processedSegments[0]?.label || 'Primary';
          const isRolesLabel = displayText.toLowerCase().includes('roles');
          labelsToShow.push({
            text: displayText,
            percentage: mergedLabelConfig.showPercentage ? primaryPercentage : undefined,
            count: mergedLabelConfig.showCount ? processedSegments[0]?.count : undefined,
            customValue: mergedLabelConfig.primaryLabelValue,
            isHealthy: isHealthy && !isRolesLabel,
          });
        }
        break;
      case 'all':
        processedSegments.forEach((segment) => {
          labelsToShow.push({
            text: segment.label,
            percentage: mergedLabelConfig.showPercentage ? segment.percentage : undefined,
            count: mergedLabelConfig.showCount ? segment.count : undefined,
            isHealthy: false, // Only primary should be styled as healthy
          });
        });
        break;
      case 'custom':
        if (mergedLabelConfig.customLabels) {
          mergedLabelConfig.customLabels.forEach((customLabel, index) => {
            const segment = processedSegments[index];
            if (segment) {
              labelsToShow.push({
                text: customLabel,
                percentage: mergedLabelConfig.showPercentage ? segment.percentage : undefined,
                count: mergedLabelConfig.showCount ? segment.count : undefined,
                isHealthy: index === 0 ? isHealthy : false,
              });
            }
          });
        }
        break;
    }

    if (labelsToShow.length === 0) return null;

    return (
      <div className={styles.labelContainer}>
        {labelsToShow.map((labelItem, index) => (
          <div key={index} className={styles.labelGroup}>
            <span
              className={`${styles.label} ${labelItem.isHealthy ? styles.healthy : ''}`}
              style={{
                color:
                  mergedLabelConfig.textColor || (labelItem.isHealthy ? mergedLabelConfig.healthyTextColor : undefined),
                fontSize: mergedLabelConfig.fontSize,
                fontWeight: mergedLabelConfig.fontWeight,
              }}
            >
              {labelItem.text}
            </span>
            {labelItem.percentage !== undefined && (
              <span
                className={`${styles.percentage} ${labelItem.isHealthy ? styles.healthy : ''}`}
                style={{
                  color:
                    mergedLabelConfig.textColor ||
                    (labelItem.isHealthy ? mergedLabelConfig.healthyTextColor : undefined),
                  fontSize: mergedLabelConfig.fontSize,
                }}
              >
                {labelItem.percentage}%
              </span>
            )}
            {labelItem.count !== undefined && (
              <span
                className={`${styles.count} ${labelItem.isHealthy ? styles.healthy : ''}`}
                style={{
                  color: mergedLabelConfig.textColor,
                  fontSize: mergedLabelConfig.fontSize,
                }}
              >
                ({labelItem.count})
              </span>
            )}
            {labelItem.customValue !== undefined && (
              <span
                className={`${styles.percentage} ${labelItem.isHealthy ? styles.healthy : ''}`}
                style={{
                  color:
                    mergedLabelConfig.textColor ||
                    (labelItem.isHealthy ? mergedLabelConfig.healthyTextColor : undefined),
                  fontSize: mergedLabelConfig.fontSize,
                }}
              >
                {labelItem.customValue}
              </span>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      className={`${styles.container} ${className || ''} ${mergedAnimationConfig.duration === 0 ? styles.noAnimation : ''} ${showSegmentLabelsOnHover ? styles.showLabelsOnHover : ''} ${showLabels ? styles.showLabels : ''}`}
      style={
        {
          '--animation-duration': `${mergedAnimationConfig.duration}ms`,
          '--bar-width': barWidth,
          '--bar-max-width': barMaxWidth,
          '--bar-height': barHeight,
          '--gap': gap,
          '--border-radius': borderRadius,
          '--label-font-size': mergedLabelConfig.fontSize || '0.875rem',
          '--healthy-color': mergedLabelConfig.healthyTextColor || '#28a745',
          ...(backgroundColor && { '--background-color': backgroundColor }),
          ...(mergedAnimationConfig.duration === 0 && {
            animation: 'none',
          }),
          ...style,
        } as React.CSSProperties
      }
    >
      {/* Labels above the bar */}
      {renderAboveLabels()}

      {/* Progress bar */}
      <div className={styles.barContainer}>
        {processedSegments.map((segment, index) => (
          <div
            key={`${segment.label}-${index}`}
            className={styles.segment}
            style={
              {
                '--segment-percentage': segment.percentage,
                '--segment-color': segment.color,
                opacity: mergedColorConfig.opacity,
                ...(mergedAnimationConfig.duration === 0 && {
                  animation: 'none',
                  transform: 'scaleX(1)',
                }),
              } as React.CSSProperties
            }
          >
            {/* Wave animation overlay */}
            {mergedAnimationConfig.enableWave && <div className={styles.waveOverlay} />}

            {/* Segment label inside the bar */}
            {(showSegmentLabels || segment.segmentLabel) && segment.percentage >= (minSegmentWidthForLabel || 15) && (
              <span
                className={styles.segmentLabel}
                style={
                  {
                    '--segment-label-color': segment.segmentLabelColor || 'white',
                    '--segment-label-font-size': mergedLabelConfig.segmentLabelFontSize,
                    '--segment-label-font-weight': mergedLabelConfig.segmentLabelFontWeight,
                    fontSize: mergedLabelConfig.segmentLabelFontSize,
                    fontWeight: mergedLabelConfig.segmentLabelFontWeight,
                    color: segment.segmentLabelColor,
                  } as React.CSSProperties
                }
              >
                {segment.segmentLabel || 
                  (mergedLabelConfig.showCount && segment.count 
                    ? `${segment.label} ${segment.count}` 
                    : segment.label)
                }
                {mergedLabelConfig.showSegmentPercentage && ` ${segment.percentage}%`}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export type {
  PercentageSegment,
  MultiPercentageBarProps,
  LabelConfig,
  ColorConfig,
  AnimationConfig,
  LabelPosition,
  LabelDisplayMode,
};
