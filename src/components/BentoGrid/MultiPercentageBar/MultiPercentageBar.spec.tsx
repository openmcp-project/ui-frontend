import { describe, it, expect } from 'vitest';

// Pure function tests for MultiPercentageBar utility logic
describe('MultiPercentageBar utilities', () => {
  interface PercentageSegment {
    percentage: number;
    color: string;
    label: string;
    count?: number;
  }

  // Helper function to filter non-zero segments (simulating component logic)
  const filterNonZeroSegments = (segments: PercentageSegment[], showOnlyNonZero: boolean) => {
    return showOnlyNonZero ? segments.filter((segment) => segment.percentage > 0) : segments;
  };

  // Helper function to validate segment percentages
  const validateSegmentPercentages = (segments: PercentageSegment[]) => {
    const total = segments.reduce((sum, segment) => sum + segment.percentage, 0);
    return {
      total,
      isValid: total <= 100,
      segments: segments.length,
    };
  };

  describe('filterNonZeroSegments', () => {
    it('filters out zero percentage segments when showOnlyNonZero is true', () => {
      const segments: PercentageSegment[] = [
        { percentage: 50, color: '#28a745', label: 'Healthy' },
        { percentage: 0, color: '#e9730c', label: 'Creating' },
        { percentage: 50, color: '#d22020ff', label: 'Unhealthy' },
      ];

      const result = filterNonZeroSegments(segments, true);

      expect(result).toHaveLength(2);
      expect(result[0].label).toBe('Healthy');
      expect(result[1].label).toBe('Unhealthy');
    });

    it('keeps all segments when showOnlyNonZero is false', () => {
      const segments: PercentageSegment[] = [
        { percentage: 50, color: '#28a745', label: 'Healthy' },
        { percentage: 0, color: '#e9730c', label: 'Creating' },
        { percentage: 50, color: '#d22020ff', label: 'Unhealthy' },
      ];

      const result = filterNonZeroSegments(segments, false);

      expect(result).toHaveLength(3);
      expect(result[1].percentage).toBe(0);
    });

    it('handles empty segments array', () => {
      const result = filterNonZeroSegments([], true);
      expect(result).toHaveLength(0);
    });

    it('handles all zero segments', () => {
      const segments: PercentageSegment[] = [
        { percentage: 0, color: '#28a745', label: 'Healthy' },
        { percentage: 0, color: '#e9730c', label: 'Creating' },
      ];

      const result = filterNonZeroSegments(segments, true);
      expect(result).toHaveLength(0);
    });
  });

  describe('validateSegmentPercentages', () => {
    it('validates segments that sum to 100%', () => {
      const segments: PercentageSegment[] = [
        { percentage: 60, color: '#28a745', label: 'Healthy' },
        { percentage: 40, color: '#d22020ff', label: 'Unhealthy' },
      ];

      const result = validateSegmentPercentages(segments);

      expect(result.total).toBe(100);
      expect(result.isValid).toBe(true);
      expect(result.segments).toBe(2);
    });

    it('detects segments that sum to more than 100%', () => {
      const segments: PercentageSegment[] = [
        { percentage: 60, color: '#28a745', label: 'Healthy' },
        { percentage: 50, color: '#d22020ff', label: 'Unhealthy' },
      ];

      const result = validateSegmentPercentages(segments);

      expect(result.total).toBe(110);
      expect(result.isValid).toBe(false);
    });

    it('handles segments that sum to less than 100%', () => {
      const segments: PercentageSegment[] = [
        { percentage: 30, color: '#28a745', label: 'Healthy' },
        { percentage: 20, color: '#d22020ff', label: 'Unhealthy' },
      ];

      const result = validateSegmentPercentages(segments);

      expect(result.total).toBe(50);
      expect(result.isValid).toBe(true);
    });

    it('handles empty segments', () => {
      const result = validateSegmentPercentages([]);

      expect(result.total).toBe(0);
      expect(result.isValid).toBe(true);
      expect(result.segments).toBe(0);
    });
  });

  describe('color configuration utilities', () => {
    // Helper function to apply color overrides (simulating component logic)
    const applyColorOverrides = (
      segments: PercentageSegment[], 
      overrides: Record<string, string>
    ) => {
      return segments.map(segment => ({
        ...segment,
        color: overrides[segment.label] || segment.color,
      }));
    };

    it('applies color overrides correctly', () => {
      const segments: PercentageSegment[] = [
        { percentage: 60, color: '#28a745', label: 'Healthy' },
        { percentage: 40, color: '#d22020ff', label: 'Unhealthy' },
      ];

      const overrides = {
        'Healthy': '#00ff00',
        'Unhealthy': '#ff0000',
      };

      const result = applyColorOverrides(segments, overrides);

      expect(result[0].color).toBe('#00ff00');
      expect(result[1].color).toBe('#ff0000');
    });

    it('keeps original colors when no overrides match', () => {
      const segments: PercentageSegment[] = [
        { percentage: 60, color: '#28a745', label: 'Healthy' },
        { percentage: 40, color: '#d22020ff', label: 'Unknown' },
      ];

      const overrides = {
        'Different': '#00ff00',
      };

      const result = applyColorOverrides(segments, overrides);

      expect(result[0].color).toBe('#28a745');
      expect(result[1].color).toBe('#d22020ff');
    });
  });

  describe('label configuration utilities', () => {
    // Helper function to determine if primary label should be hidden
    const shouldHidePrimaryLabel = (
      segments: PercentageSegment[], 
      hideWhenSingleFull: boolean
    ) => {
      return hideWhenSingleFull && 
        segments.length === 1 && 
        segments[0]?.percentage === 100;
    };

    it('hides primary label when single segment is 100%', () => {
      const segments: PercentageSegment[] = [
        { percentage: 100, color: '#28a745', label: 'Complete' },
      ];

      expect(shouldHidePrimaryLabel(segments, true)).toBe(true);
      expect(shouldHidePrimaryLabel(segments, false)).toBe(false);
    });

    it('shows primary label when multiple segments or not 100%', () => {
      const multipleSegments: PercentageSegment[] = [
        { percentage: 50, color: '#28a745', label: 'Healthy' },
        { percentage: 50, color: '#d22020ff', label: 'Unhealthy' },
      ];

      const partialSegment: PercentageSegment[] = [
        { percentage: 80, color: '#28a745', label: 'Partial' },
      ];

      expect(shouldHidePrimaryLabel(multipleSegments, true)).toBe(false);
      expect(shouldHidePrimaryLabel(partialSegment, true)).toBe(false);
    });
  });
});
