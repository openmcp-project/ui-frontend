import React, { useEffect, useRef, useState, useMemo } from 'react';
import styles from './Hints.module.css';

interface PercentageSegment {
  percentage: number;
  color: string;
  label: string;
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
  isHealthy?: boolean; // Control whether to style as healthy (green)
  labelFontSize?: string;
  labelColor?: string;
  labelFontWeight?: string;
  gap?: string;
  borderRadius?: string;
  backgroundColor?: string;
  className?: string;
  style?: React.CSSProperties;
  animationDuration?: number; // Animation duration in ms
}

export const MultiPercentageBar: React.FC<MultiPercentageBarProps> = ({
  segments,
  label,
  showOnlyNonZero = true,
  barWidth = '80%',
  barMaxWidth = '400px',
  barHeight = '8px',
  showLabels = true,
  showPercentage = true, // Default to showing percentage
  isHealthy, // New prop to control healthy styling
  labelFontSize = '0.875rem',
  gap = '2px',
  borderRadius = '6px',
  backgroundColor, // Remove default value to use CSS class
  className,
  style,
  animationDuration = 600, // Default 600ms animation
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [wavePosition, setWavePosition] = useState(-80);
  const [animatedSegments, setAnimatedSegments] = useState<PercentageSegment[]>([]);
  const [animatedPrimaryPercentage, setAnimatedPrimaryPercentage] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const lastSegmentsRef = useRef<PercentageSegment[]>([]);
  const currentAnimatedSegmentsRef = useRef<PercentageSegment[]>([]);
  const currentPrimaryPercentageRef = useRef<number>(0);
  const initializedRef = useRef<boolean>(false);

  // Memoize filtered segments to prevent infinite re-renders
  const filteredSegments = useMemo(() => {
    return showOnlyNonZero ? segments.filter((segment) => segment.percentage > 0) : segments;
  }, [segments, showOnlyNonZero]);

  // Initialize visibility animation and subtle wave
  useEffect(() => {
    // Trigger initial appearance animation
    const timer = setTimeout(() => setIsVisible(true), 100);

    // Start subtle wave animation
    intervalRef.current = setInterval(() => {
      setWavePosition((prev) => {
        if (prev >= 150) {
          return -80; // Reset to start position
        }
        return prev + 2; // Move 1% each frame for smooth animation
      });
    }, 50); // 50ms intervals for smooth animation

    return () => {
      clearTimeout(timer);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Animate segments when they change
  useEffect(() => {
    if (filteredSegments.length === 0) {
      setAnimatedSegments([]);
      setAnimatedPrimaryPercentage(0);
      lastSegmentsRef.current = [];
      currentAnimatedSegmentsRef.current = [];
      currentPrimaryPercentageRef.current = 0;
      return;
    }

    // Check if segments have actually changed to prevent unnecessary animations
    const lastSegments = lastSegmentsRef.current;
    const segmentsChanged =
      filteredSegments.length !== lastSegments.length ||
      filteredSegments.some(
        (segment, index) =>
          lastSegments[index]?.percentage !== segment.percentage ||
          lastSegments[index]?.color !== segment.color ||
          lastSegments[index]?.label !== segment.label,
      );

    if (!segmentsChanged) {
      return;
    }

    // Update the ref with current segments
    lastSegmentsRef.current = [...filteredSegments];

    const targetPrimaryPercentage = filteredSegments[0]?.percentage || 0;
    const startTime = Date.now();
    const startSegments =
      currentAnimatedSegmentsRef.current.length > 0
        ? currentAnimatedSegmentsRef.current
        : filteredSegments.map((s) => ({ ...s, percentage: 0 }));
    const startPrimaryPercentage = currentPrimaryPercentageRef.current;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);

      // Easing function for smooth animation
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
      const easedProgress = easeOutCubic(progress);

      // Animate segments
      const newAnimatedSegments = filteredSegments.map((target, index) => {
        const start = startSegments[index] || { ...target, percentage: 0 };
        return {
          ...target,
          percentage: start.percentage + (target.percentage - start.percentage) * easedProgress,
        };
      });

      // Animate primary percentage
      const newPrimaryPercentage =
        startPrimaryPercentage + (targetPrimaryPercentage - startPrimaryPercentage) * easedProgress;
      const roundedPrimaryPercentage = Math.round(newPrimaryPercentage);

      // Update refs for next animation
      currentAnimatedSegmentsRef.current = newAnimatedSegments;
      currentPrimaryPercentageRef.current = roundedPrimaryPercentage;

      // Update state
      setAnimatedSegments(newAnimatedSegments);
      setAnimatedPrimaryPercentage(roundedPrimaryPercentage);

      if (progress < 1) {
        animationRef.current = setTimeout(animate, 16); // ~60fps
      }
    };

    // Clear any existing animation
    if (animationRef.current) {
      clearTimeout(animationRef.current);
    }

    animate();

    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [filteredSegments, animationDuration]);

  // Initialize animated segments on first render or when segments change significantly
  useEffect(() => {
    if (!initializedRef.current && filteredSegments.length > 0) {
      const initialPercentage = filteredSegments[0]?.percentage || 0;
      setAnimatedSegments(filteredSegments);
      setAnimatedPrimaryPercentage(initialPercentage);
      currentAnimatedSegmentsRef.current = filteredSegments;
      currentPrimaryPercentageRef.current = initialPercentage;
      initializedRef.current = true;
    }
  }, [filteredSegments]);

  if (filteredSegments.length === 0) {
    return null;
  }

  // Use animated values instead of raw values
  const displaySegments = animatedSegments.length > 0 ? animatedSegments : filteredSegments;
  const displayPrimaryPercentage = animatedPrimaryPercentage;

  // Use provided label or default to 'Healthy'
  const displayLabel = label || 'Healthy';

  // Check if all resources are healthy - use isHealthy prop if provided, otherwise fall back to percentage check
  const allHealthy = isHealthy !== undefined ? isHealthy : displayPrimaryPercentage === 100;

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        width: '100%',
        paddingBottom: '8px',
        ...style,
      }}
    >
      {/* Label with conditional styling */}
      {showLabels && (
        <div
          style={{
            display: 'flex',
            gap: '6px',
            flexWrap: 'wrap',
            justifyContent: 'left',
            width: '80%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {showPercentage && (
              <span
                className={`${styles.chartLabel} ${allHealthy ? '' : ''}`}
                style={{
                  fontSize: labelFontSize,
                  color: allHealthy ? 'green' : undefined,
                  fontWeight: allHealthy ? '700' : '400',
                }}
              >
                {displayPrimaryPercentage}%
              </span>
            )}
            <span
              className={`${styles.chartLabel} ${allHealthy ? '' : ''}`}
              style={{
                fontSize: labelFontSize,
                color: allHealthy ? 'green' : undefined,
                fontWeight: allHealthy ? '700' : '400',
              }}
            >
              {displayLabel}
            </span>
          </div>
        </div>
      )}

      {/* Colored bars */}
      <div
        className={styles.chartBackground}
        style={{
          display: 'flex',
          gap,
          width: barWidth,
          maxWidth: barMaxWidth,
          ...(backgroundColor && { backgroundColor }), // Only override if explicitly provided
          borderRadius,
          padding: '2px',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
        }}
      >
        {displaySegments.map((segment, index) => {
          return (
            <div
              key={index}
              style={{
                flex: segment.percentage,
                minWidth: '10px',
                backgroundColor: segment.color,
                borderRadius,
                height: barHeight,
                position: 'relative',
                overflow: 'hidden',
                transition: 'flex 0.3s ease-out', // Add smooth transition for flex changes
              }}
            >
              {/* Subtle wave overlay */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: `${wavePosition}%`,
                  width: '80%',
                  height: '100%',
                  background: `linear-gradient(90deg, 
                    transparent 0%, 
                    rgba(255, 255, 255, 0.15) 25%, 
                    rgba(255, 255, 255, 0.25) 50%, 
                    rgba(255, 255, 255, 0.15) 75%, 
                    transparent 100%)`,
                  borderRadius,
                  pointerEvents: 'none',
                  transition: 'none',
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export type { PercentageSegment, MultiPercentageBarProps };
