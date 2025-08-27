import { describe, it, expect, vi } from 'vitest';
import {
  calculateCrossplaneSegments,
  calculateGitOpsSegments,
  calculateVaultSegments,
  calculateCrossplaneHoverData,
  HINT_COLORS,
} from './hintsCardsRowCalculations';
import { ManagedResourceItem, Condition } from '../lib/shared/types';
import { APIError } from '../lib/api/error';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('calculations', () => {
  // Mock translation function
  const mockT = (key: string) => key;

  const createManagedResourceItem = (
    kind: string = 'TestResource',
    conditions: Condition[] = [],
  ): ManagedResourceItem => ({
    kind,
    metadata: {
      name: 'test-resource',
      creationTimestamp: '2023-01-01T00:00:00Z',
      labels: [],
    },
    status: {
      conditions,
    },
  });

  const createCondition = (type: string, status: 'True' | 'False'): Condition => ({
    type,
    status,
    lastTransitionTime: '2023-01-01T00:00:00Z',
  });

  describe('calculateCrossplaneSegments', () => {
    it('returns loading state when isLoading is true', () => {
      const result = calculateCrossplaneSegments([], true, undefined, true, mockT);

      expect(result.segments).toHaveLength(1);
      expect(result.segments[0].color).toBe(HINT_COLORS.inactive);
      expect(result.showPercentage).toBe(false);
      expect(result.isHealthy).toBe(false);
    });

    it('returns error state when error is provided', () => {
      const error = new APIError('Test error', 500);
      const result = calculateCrossplaneSegments([], false, error, true, mockT);

      expect(result.segments).toHaveLength(1);
      expect(result.segments[0].color).toBe(HINT_COLORS.unhealthy);
      expect(result.showPercentage).toBe(false);
      expect(result.isHealthy).toBe(false);
    });

    it('returns inactive state when enabled is false', () => {
      const result = calculateCrossplaneSegments([], false, undefined, false, mockT);

      expect(result.segments).toHaveLength(1);
      expect(result.segments[0].color).toBe(HINT_COLORS.inactive);
      expect(result.showPercentage).toBe(false);
      expect(result.isHealthy).toBe(false);
    });

    it('returns no resources state when items array is empty', () => {
      const result = calculateCrossplaneSegments([], false, undefined, true, mockT);

      expect(result.segments).toHaveLength(1);
      expect(result.segments[0].color).toBe(HINT_COLORS.inactive);
      expect(result.showPercentage).toBe(false);
      expect(result.isHealthy).toBe(false);
    });

    it('correctly calculates segments for healthy resources', () => {
      const healthyItems = [
        createManagedResourceItem('Pod', [createCondition('Ready', 'True'), createCondition('Synced', 'True')]),
        createManagedResourceItem('Service', [createCondition('Ready', 'True'), createCondition('Synced', 'True')]),
      ];

      const result = calculateCrossplaneSegments(healthyItems, false, undefined, true, mockT);

      expect(result.segments).toHaveLength(3);
      expect(result.segments[0].percentage).toBe(100); // healthy
      expect(result.segments[1].percentage).toBe(0); // creating
      expect(result.segments[2].percentage).toBe(0); // unhealthy
      expect(result.isHealthy).toBe(true);
      expect(result.showPercentage).toBe(true);
    });

    it('correctly calculates segments for creating resources', () => {
      const creatingItems = [
        createManagedResourceItem('Pod', [createCondition('Ready', 'False'), createCondition('Synced', 'True')]),
      ];

      const result = calculateCrossplaneSegments(creatingItems, false, undefined, true, mockT);

      expect(result.segments).toHaveLength(3);
      expect(result.segments[0].percentage).toBe(0); // healthy
      expect(result.segments[1].percentage).toBe(100); // creating
      expect(result.segments[2].percentage).toBe(0); // unhealthy
      expect(result.isHealthy).toBe(false);
    });

    it('correctly calculates segments for unhealthy resources', () => {
      const unhealthyItems = [
        createManagedResourceItem('Pod', [createCondition('Ready', 'False'), createCondition('Synced', 'False')]),
      ];

      const result = calculateCrossplaneSegments(unhealthyItems, false, undefined, true, mockT);

      expect(result.segments).toHaveLength(3);
      expect(result.segments[0].percentage).toBe(0); // healthy
      expect(result.segments[1].percentage).toBe(0); // creating
      expect(result.segments[2].percentage).toBe(100); // unhealthy
      expect(result.isHealthy).toBe(false);
    });

    it('correctly calculates mixed resource states', () => {
      const mixedItems = [
        createManagedResourceItem('Pod1', [createCondition('Ready', 'True'), createCondition('Synced', 'True')]),
        createManagedResourceItem('Pod2', [createCondition('Ready', 'False'), createCondition('Synced', 'True')]),
        createManagedResourceItem('Pod3', [createCondition('Ready', 'False'), createCondition('Synced', 'False')]),
        createManagedResourceItem('Pod4', []), // No conditions = unhealthy
      ];

      const result = calculateCrossplaneSegments(mixedItems, false, undefined, true, mockT);

      expect(result.segments).toHaveLength(3);
      expect(result.segments[0].percentage).toBe(25); // 1/4 healthy
      expect(result.segments[1].percentage).toBe(25); // 1/4 creating
      expect(result.segments[2].percentage).toBe(50); // 2/4 unhealthy
      expect(result.isHealthy).toBe(false);
    });
  });

  describe('calculateGitOpsSegments', () => {
    it('returns loading state when isLoading is true', () => {
      const result = calculateGitOpsSegments([], true, undefined, true, mockT);

      expect(result.segments).toHaveLength(1);
      expect(result.segments[0].color).toBe(HINT_COLORS.inactive);
      expect(result.showPercentage).toBe(false);
      expect(result.isHealthy).toBe(false);
    });

    it('correctly calculates progress for flux-labeled resources', () => {
      const itemWithFluxLabel = createManagedResourceItem('Pod');
      itemWithFluxLabel.metadata.labels = {
        'kustomize.toolkit.fluxcd.io/name': 'test-app',
      } as any;

      const itemWithoutFluxLabel = createManagedResourceItem('Service');

      const items = [itemWithFluxLabel, itemWithoutFluxLabel];
      const result = calculateGitOpsSegments(items, false, undefined, true, mockT);

      expect(result.segments).toHaveLength(2);
      expect(result.segments[0].percentage).toBe(50); // 1/2 with flux label
      expect(result.segments[1].percentage).toBe(50); // 1/2 remaining
      expect(result.isHealthy).toBe(false); // < 70%
    });

    it('marks as healthy when progress >= 70%', () => {
      const items = Array.from({ length: 10 }, (_, i) => {
        const item = createManagedResourceItem(`Pod${i}`);
        if (i < 8) {
          // 8/10 = 80%
          item.metadata.labels = {
            'kustomize.toolkit.fluxcd.io/name': 'test-app',
          } as any;
        }
        return item;
      });

      const result = calculateGitOpsSegments(items, false, undefined, true, mockT);

      expect(result.segments[0].percentage).toBe(80);
      expect(result.segments[0].color).toBe(HINT_COLORS.healthy);
      expect(result.isHealthy).toBe(true);
    });

    it('uses progress color when progress < 70%', () => {
      const items = Array.from({ length: 10 }, (_, i) => {
        const item = createManagedResourceItem(`Pod${i}`);
        if (i < 5) {
          // 5/10 = 50%
          item.metadata.labels = {
            'kustomize.toolkit.fluxcd.io/name': 'test-app',
          } as any;
        }
        return item;
      });

      const result = calculateGitOpsSegments(items, false, undefined, true, mockT);

      expect(result.segments[0].percentage).toBe(50);
      expect(result.segments[0].color).toBe(HINT_COLORS.progress);
      expect(result.isHealthy).toBe(false);
    });
  });

  describe('calculateVaultSegments', () => {
    it('returns active state when resources exist', () => {
      const items = [createManagedResourceItem('Secret')];
      const result = calculateVaultSegments(items, false, undefined, true, mockT);

      expect(result.segments).toHaveLength(1);
      expect(result.segments[0].percentage).toBe(100);
      expect(result.segments[0].color).toBe(HINT_COLORS.healthy);
      expect(result.isHealthy).toBe(true);
      expect(result.showPercentage).toBe(true);
    });

    it('returns inactive state when no resources exist', () => {
      const result = calculateVaultSegments([], false, undefined, true, mockT);

      expect(result.segments).toHaveLength(1);
      expect(result.segments[0].percentage).toBe(100);
      expect(result.segments[0].color).toBe(HINT_COLORS.inactive);
      expect(result.isHealthy).toBe(false);
    });
  });

  describe('calculateCrossplaneHoverData', () => {
    it('calculates statistics by resource type', () => {
      const items = [
        createManagedResourceItem('Pod', [createCondition('Ready', 'True'), createCondition('Synced', 'True')]),
        createManagedResourceItem('Pod', [createCondition('Ready', 'False'), createCondition('Synced', 'True')]),
        createManagedResourceItem('Service', [createCondition('Ready', 'True'), createCondition('Synced', 'True')]),
        createManagedResourceItem('Service', [createCondition('Ready', 'False'), createCondition('Synced', 'False')]),
      ];

      const result = calculateCrossplaneHoverData(items);

      expect(result.resourceTypeStats).toHaveLength(2);

      const podStats = result.resourceTypeStats.find((s) => s.type === 'Pod');
      expect(podStats).toBeDefined();
      expect(podStats!.total).toBe(2);
      expect(podStats!.healthy).toBe(1);
      expect(podStats!.creating).toBe(1);
      expect(podStats!.unhealthy).toBe(0);
      expect(podStats!.healthyPercentage).toBe(50);

      const serviceStats = result.resourceTypeStats.find((s) => s.type === 'Service');
      expect(serviceStats).toBeDefined();
      expect(serviceStats!.total).toBe(2);
      expect(serviceStats!.healthy).toBe(1);
      expect(serviceStats!.creating).toBe(0);
      expect(serviceStats!.unhealthy).toBe(1);
      expect(serviceStats!.unhealthyPercentage).toBe(50);
    });

    it('calculates overall statistics correctly', () => {
      const items = [
        createManagedResourceItem('Pod', [createCondition('Ready', 'True'), createCondition('Synced', 'True')]),
        createManagedResourceItem('Service', [createCondition('Ready', 'False'), createCondition('Synced', 'True')]),
        createManagedResourceItem('ConfigMap', [createCondition('Ready', 'False'), createCondition('Synced', 'False')]),
      ];

      const result = calculateCrossplaneHoverData(items);

      expect(result.overallStats.total).toBe(3);
      expect(result.overallStats.healthy).toBe(1);
      expect(result.overallStats.creating).toBe(1);
      expect(result.overallStats.unhealthy).toBe(1);
    });

    it('handles resources without kind', () => {
      const itemWithoutKind = createManagedResourceItem('', [
        createCondition('Ready', 'True'),
        createCondition('Synced', 'True'),
      ]);
      // @ts-ignore - testing edge case
      itemWithoutKind.kind = undefined;

      const result = calculateCrossplaneHoverData([itemWithoutKind]);

      expect(result.resourceTypeStats).toHaveLength(1);
      expect(result.resourceTypeStats[0].type).toBe('Unknown');
      expect(result.resourceTypeStats[0].healthy).toBe(1);
    });

    it('handles resources without conditions', () => {
      const itemWithoutConditions = createManagedResourceItem('Pod');
      delete itemWithoutConditions.status;

      const result = calculateCrossplaneHoverData([itemWithoutConditions]);

      expect(result.resourceTypeStats).toHaveLength(1);
      expect(result.resourceTypeStats[0].type).toBe('Pod');
      expect(result.resourceTypeStats[0].unhealthy).toBe(1);
      expect(result.overallStats.unhealthy).toBe(1);
    });

    it('returns empty arrays for no items', () => {
      const result = calculateCrossplaneHoverData([]);

      expect(result.resourceTypeStats).toHaveLength(0);
      expect(result.overallStats.total).toBe(0);
      expect(result.overallStats.healthy).toBe(0);
      expect(result.overallStats.creating).toBe(0);
      expect(result.overallStats.unhealthy).toBe(0);
    });
  });
});
