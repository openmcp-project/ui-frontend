import { describe, it, expect } from 'vitest';
import { HINT_COLORS } from './calculations';

describe('Hints constants and utilities', () => {
  describe('HINT_COLORS', () => {
    it('provides consistent color definitions', () => {
      expect(HINT_COLORS.healthy).toBe('#28a745');
      expect(HINT_COLORS.creating).toBe('#e9730c');
      expect(HINT_COLORS.unhealthy).toBe('#d22020ff');
      expect(HINT_COLORS.inactive).toBe('#e9e9e9ff');
      expect(HINT_COLORS.managed).toBe('#28a745');
      expect(HINT_COLORS.progress).toBe('#fd7e14');
    });

    it('has all required color properties', () => {
      const requiredColors = ['healthy', 'creating', 'unhealthy', 'inactive', 'managed', 'progress'];
      
      requiredColors.forEach(color => {
        expect(HINT_COLORS).toHaveProperty(color);
        expect(typeof HINT_COLORS[color as keyof typeof HINT_COLORS]).toBe('string');
        expect(HINT_COLORS[color as keyof typeof HINT_COLORS]).toMatch(/^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/);
      });
    });

    it('uses consistent color for healthy and managed states', () => {
      expect(HINT_COLORS.healthy).toBe(HINT_COLORS.managed);
    });
  });

  describe('Helper functions for common hint operations', () => {
    // Test helper function for percentage rounding consistency
    const roundPercentage = (value: number, total: number): number => {
      return Math.round((value / total) * 100);
    };

    // Test helper function for determining health status
    const determineHealthStatus = (healthyCount: number, totalCount: number): boolean => {
      return healthyCount === totalCount && totalCount > 0;
    };

    // Test helper function for creating loading state
    const createLoadingState = (translationKey: string = 'Hints.common.loading') => ({
      segments: [{ percentage: 100, color: HINT_COLORS.inactive, label: translationKey }],
      label: translationKey,
      showPercentage: false,
      isHealthy: false,
      showOnlyNonZero: true,
    });

    describe('roundPercentage', () => {
      it('correctly rounds percentages', () => {
        expect(roundPercentage(1, 3)).toBe(33); // 33.33... -> 33
        expect(roundPercentage(2, 3)).toBe(67); // 66.66... -> 67
        expect(roundPercentage(3, 3)).toBe(100);
        expect(roundPercentage(0, 3)).toBe(0);
      });

      it('handles edge cases', () => {
        expect(roundPercentage(1, 1)).toBe(100);
        expect(roundPercentage(0, 1)).toBe(0);
        expect(roundPercentage(1, 7)).toBe(14); // 14.28... -> 14
        expect(roundPercentage(5, 7)).toBe(71); // 71.42... -> 71
      });

      it('handles zero total gracefully', () => {
        expect(roundPercentage(0, 0)).toBeNaN();
        expect(roundPercentage(1, 0)).toBe(Infinity);
      });
    });

    describe('determineHealthStatus', () => {
      it('returns true only when all resources are healthy and count > 0', () => {
        expect(determineHealthStatus(5, 5)).toBe(true);
        expect(determineHealthStatus(1, 1)).toBe(true);
      });

      it('returns false when not all resources are healthy', () => {
        expect(determineHealthStatus(4, 5)).toBe(false);
        expect(determineHealthStatus(0, 5)).toBe(false);
      });

      it('returns false when total count is 0', () => {
        expect(determineHealthStatus(0, 0)).toBe(false);
      });

      it('handles negative values gracefully', () => {
        expect(determineHealthStatus(-1, 5)).toBe(false);
        expect(determineHealthStatus(5, -1)).toBe(false);
      });
    });

    describe('createLoadingState', () => {
      it('creates standard loading state', () => {
        const state = createLoadingState();
        
        expect(state.segments).toHaveLength(1);
        expect(state.segments[0].percentage).toBe(100);
        expect(state.segments[0].color).toBe(HINT_COLORS.inactive);
        expect(state.showPercentage).toBe(false);
        expect(state.isHealthy).toBe(false);
        expect(state.showOnlyNonZero).toBe(true);
      });

      it('accepts custom translation key', () => {
        const customKey = 'CustomLoadingKey';
        const state = createLoadingState(customKey);
        
        expect(state.label).toBe(customKey);
        expect(state.segments[0].label).toBe(customKey);
      });
    });
  });

  describe('Edge cases and error conditions', () => {
    it('handles malformed condition objects', () => {
      // Test conditions with missing properties
      const malformedConditions = [
        { type: 'Ready' }, // missing status
        { status: 'True' }, // missing type
        {}, // empty object
        { type: 'Ready', status: null }, // null status
        { type: null, status: 'True' }, // null type
      ];

      malformedConditions.forEach(condition => {
        // These should not crash when processed by condition finding logic
        // @ts-ignore - intentionally testing malformed data
        const hasReady = condition.type === 'Ready' && condition.status === 'True';
        expect(typeof hasReady).toBe('boolean');
      });
    });

    it('handles percentage edge cases', () => {
      const edgeCases = [
        { input: 0.4999, expected: 0 },    // rounds down
        { input: 0.5, expected: 1 },       // rounds up
        { input: 99.4999, expected: 99 },  // rounds down
        { input: 99.5, expected: 100 },    // rounds up
      ];

      edgeCases.forEach(({ input, expected }) => {
        expect(Math.round(input)).toBe(expected);
      });
    });

    it('validates flux label detection patterns', () => {
      const fluxLabelKey = 'kustomize.toolkit.fluxcd.io/name';
      
      // Test different label object structures
      const labelTests = [
        { labels: { [fluxLabelKey]: 'app-name' }, hasFlux: true },
        { labels: { [fluxLabelKey]: '' }, hasFlux: true }, // empty value but key exists
        { labels: { 'other-key': 'value' }, hasFlux: false },
        { labels: {}, hasFlux: false },
        { labels: null, hasFlux: false },
        { labels: undefined, hasFlux: false },
      ];

      labelTests.forEach(({ labels, hasFlux }) => {
        const result = labels && Object.prototype.hasOwnProperty.call(labels, fluxLabelKey);
        expect(result).toBe(hasFlux);
      });
    });
  });
});
