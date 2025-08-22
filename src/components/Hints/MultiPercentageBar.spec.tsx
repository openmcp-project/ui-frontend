import { describe, it, expect } from 'vitest';

// Pure function tests for MultiPercentageBar utility logic
describe('MultiPercentageBar utilities', () => {
  interface PercentageSegment {
    percentage: number;
    color: string;
    label: string;
  }

  // Helper function to filter non-zero segments (simulating component logic)
  const filterNonZeroSegments = (segments: PercentageSegment[], showOnlyNonZero: boolean) => {
    return showOnlyNonZero ? segments.filter(segment => segment.percentage > 0) : segments;
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

  // Helper function to calculate animation delay for segments
  const calculateAnimationDelays = (segments: PercentageSegment[], baseDelay: number = 100) => {
    return segments.map((segment, index) => ({
      ...segment,
      animationDelay: index * baseDelay,
    }));
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

  describe('calculateAnimationDelays', () => {
    it('calculates staggered animation delays', () => {
      const segments: PercentageSegment[] = [
        { percentage: 33, color: '#28a745', label: 'Healthy' },
        { percentage: 33, color: '#e9730c', label: 'Creating' },
        { percentage: 34, color: '#d22020ff', label: 'Unhealthy' },
      ];

      const result = calculateAnimationDelays(segments, 150);
      
      expect(result[0].animationDelay).toBe(0);
      expect(result[1].animationDelay).toBe(150);
      expect(result[2].animationDelay).toBe(300);
    });

    it('uses default delay when not specified', () => {
      const segments: PercentageSegment[] = [
        { percentage: 50, color: '#28a745', label: 'Healthy' },
        { percentage: 50, color: '#d22020ff', label: 'Unhealthy' },
      ];

      const result = calculateAnimationDelays(segments);
      
      expect(result[0].animationDelay).toBe(0);
      expect(result[1].animationDelay).toBe(100);
    });

    it('handles empty segments array', () => {
      const result = calculateAnimationDelays([]);
      expect(result).toHaveLength(0);
    });
  });
});
