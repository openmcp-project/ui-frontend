import React, { useMemo } from 'react';
import styles from './MultiPercentageBar.module.css';

interface PercentageSegment {
  percentage: number;
  color: string;
  label: string;
  count?: number; // Optional count for displaying inside segments
}

interface MultiPercentageBarProps {
  segments: PercentageSegment[];
  label?: string;
  showOnlyNonZero?: boolean;
  barWidth?: string;
  barMaxWidth?: string;
  barHeight?: string;
  showLabels?: boolean;
  showPercentage?: boolean; // Control whether to show percentage number
  isHealthy?: boolean; // Control whether to style the text as healthy (green)
  labelFontSize?: string;
  gap?: string;
  borderRadius?: string;
  backgroundColor?: string;
  className?: string;
  style?: React.CSSProperties;
  animationDuration?: number; // Animation duration in ms (for CSS custom property)
  showSegmentLabels?: boolean; // Control whether to show labels inside segments
  minSegmentWidthForLabel?: number; // Minimum percentage to show label inside segment
}

export const MultiPercentageBar: React.FC<MultiPercentageBarProps> = ({
  segments,
  label,
  showOnlyNonZero = true,
  barWidth = '80%',
  barMaxWidth = '400px',
  barHeight = '8px',
  showLabels = true,
  showPercentage = true,
  isHealthy,
  labelFontSize = '0.875rem',
  gap = '2px',
  borderRadius = '6px',
  backgroundColor,
  className,
  style,
  animationDuration = 400, // Match CSS default
  showSegmentLabels = false,
  minSegmentWidthForLabel = 15, // Only show label if segment is at least 15%
}) => {
  // Memoize filtered segments
  const filteredSegments = useMemo(() => {
    return showOnlyNonZero ? segments.filter((segment) => segment.percentage > 0) : segments;
  }, [segments, showOnlyNonZero]);

  if (filteredSegments.length === 0) {
    return null;
  }

  const primaryPercentage = filteredSegments[0]?.percentage || 0;
  const displayLabel = label || 'Healthy';
  const allHealthy = isHealthy !== undefined ? isHealthy : primaryPercentage === 100;

  return (
    <div
      className={`${styles.container} ${className || ''}`}
      style={
        {
          '--animation-duration': `${animationDuration}ms`,
          '--bar-width': barWidth,
          '--bar-max-width': barMaxWidth,
          '--bar-height': barHeight,
          '--gap': gap,
          '--border-radius': borderRadius,
          '--label-font-size': labelFontSize,
          ...(backgroundColor && { '--background-color': backgroundColor }),
          ...style,
        } as React.CSSProperties
      }
    >
      {/* Label */}
      {showLabels && (
        <div className={styles.labelContainer}>
          <div className={styles.labelGroup}>
            <span className={`${styles.label} ${allHealthy ? styles.healthy : ''}`}>{displayLabel}</span>
            {showPercentage && (
              <span className={`${styles.percentage} ${allHealthy ? styles.healthy : ''}`}>{primaryPercentage}%</span>
            )}
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className={styles.barContainer}>
        {filteredSegments.map((segment, index) => (
          <div
            key={`${segment.label}-${index}`}
            className={styles.segment}
            style={
              {
                '--segment-percentage': segment.percentage,
                '--segment-color': segment.color,
              } as React.CSSProperties
            }
          >
            {/* Wave animation overlay */}
            <div className={styles.waveOverlay} />
            
            {/* Segment label inside the bar */}
            {showSegmentLabels && segment.percentage >= minSegmentWidthForLabel && (
              <span className={styles.segmentLabel}>
                {segment.count ? `${segment.label} ${segment.count}` : segment.label}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export type { PercentageSegment, MultiPercentageBarProps };
