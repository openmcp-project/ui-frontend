import { describe, it, expect } from 'vitest';
import { calculateCrossplaneHoverData } from './hoverCalculations';
import { ManagedResourceItem, Condition } from '../../lib/shared/types';

describe('hoverCalculations', () => {
  const createManagedResourceItem = (
    kind: string = 'TestResource',
    conditions: Condition[] = []
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

  describe('calculateCrossplaneHoverData', () => {
    it('groups resources by type and calculates percentages correctly', () => {
      const items = [
        // Pod resources - mixed health
        createManagedResourceItem('Pod', [
          createCondition('Ready', 'True'),
          createCondition('Synced', 'True'),
        ]),
        createManagedResourceItem('Pod', [
          createCondition('Ready', 'False'),
          createCondition('Synced', 'True'),
        ]),
        createManagedResourceItem('Pod', [
          createCondition('Ready', 'False'),
          createCondition('Synced', 'False'),
        ]),
        // Service resources - all healthy
        createManagedResourceItem('Service', [
          createCondition('Ready', 'True'),
          createCondition('Synced', 'True'),
        ]),
        createManagedResourceItem('Service', [
          createCondition('Ready', 'True'),
          createCondition('Synced', 'True'),
        ]),
      ];

      const result = calculateCrossplaneHoverData(items);
      
      expect(result.resourceTypeStats).toHaveLength(2);
      
      // Check Pod statistics
      const podStats = result.resourceTypeStats.find(s => s.type === 'Pod');
      expect(podStats).toBeDefined();
      expect(podStats!.total).toBe(3);
      expect(podStats!.healthy).toBe(1);
      expect(podStats!.creating).toBe(1);
      expect(podStats!.unhealthy).toBe(1);
      expect(podStats!.healthyPercentage).toBe(33); // 1/3 rounded
      expect(podStats!.creatingPercentage).toBe(33); // 1/3 rounded
      expect(podStats!.unhealthyPercentage).toBe(33); // 1/3 rounded

      // Check Service statistics
      const serviceStats = result.resourceTypeStats.find(s => s.type === 'Service');
      expect(serviceStats).toBeDefined();
      expect(serviceStats!.total).toBe(2);
      expect(serviceStats!.healthy).toBe(2);
      expect(serviceStats!.creating).toBe(0);
      expect(serviceStats!.unhealthy).toBe(0);
      expect(serviceStats!.healthyPercentage).toBe(100);
      expect(serviceStats!.creatingPercentage).toBe(0);
      expect(serviceStats!.unhealthyPercentage).toBe(0);
    });

    it('handles edge case of single resource type', () => {
      const items = [
        createManagedResourceItem('ConfigMap', [
          createCondition('Ready', 'True'),
          createCondition('Synced', 'True'),
        ]),
      ];

      const result = calculateCrossplaneHoverData(items);
      
      expect(result.resourceTypeStats).toHaveLength(1);
      expect(result.resourceTypeStats[0].type).toBe('ConfigMap');
      expect(result.resourceTypeStats[0].total).toBe(1);
      expect(result.resourceTypeStats[0].healthy).toBe(1);
      expect(result.resourceTypeStats[0].healthyPercentage).toBe(100);
    });

    it('calculates overall statistics across all resource types', () => {
      const items = [
        createManagedResourceItem('Pod', [
          createCondition('Ready', 'True'),
          createCondition('Synced', 'True'),
        ]),
        createManagedResourceItem('Service', [
          createCondition('Ready', 'False'),
          createCondition('Synced', 'True'),
        ]),
        createManagedResourceItem('ConfigMap', [
          createCondition('Ready', 'False'),
          createCondition('Synced', 'False'),
        ]),
        createManagedResourceItem('Secret', [
          createCondition('Ready', 'True'),
          createCondition('Synced', 'True'),
        ]),
      ];

      const result = calculateCrossplaneHoverData(items);
      
      expect(result.overallStats.total).toBe(4);
      expect(result.overallStats.healthy).toBe(2); // Pod + Secret
      expect(result.overallStats.creating).toBe(1); // Service
      expect(result.overallStats.unhealthy).toBe(1); // ConfigMap
    });

    it('handles resources with missing or malformed conditions', () => {
      const items = [
        // Resource with no conditions
        createManagedResourceItem('Pod', []),
        // Resource with only Ready condition
        createManagedResourceItem('Service', [
          createCondition('Ready', 'True'),
        ]),
        // Resource with only Synced condition
        createManagedResourceItem('ConfigMap', [
          createCondition('Synced', 'True'),
        ]),
        // Resource with both conditions false
        createManagedResourceItem('Secret', [
          createCondition('Ready', 'False'),
          createCondition('Synced', 'False'),
        ]),
      ];

      const result = calculateCrossplaneHoverData(items);
      
      expect(result.overallStats.total).toBe(4);
      expect(result.overallStats.healthy).toBe(0); // No resources have both Ready=True and Synced=True
      expect(result.overallStats.creating).toBe(1); // Only ConfigMap has Synced=True but not Ready=True
      expect(result.overallStats.unhealthy).toBe(3); // Pod (no conditions), Service (missing Synced), Secret (both false)
    });

    it('correctly identifies resources in creating state', () => {
      const items = [
        // Creating: Synced but not Ready
        createManagedResourceItem('Pod', [
          createCondition('Ready', 'False'),
          createCondition('Synced', 'True'),
        ]),
        // Creating: Synced but no Ready condition
        createManagedResourceItem('Service', [
          createCondition('Synced', 'True'),
        ]),
        // Not creating: has Ready but not Synced
        createManagedResourceItem('ConfigMap', [
          createCondition('Ready', 'True'),
          createCondition('Synced', 'False'),
        ]),
      ];

      const result = calculateCrossplaneHoverData(items);
      
      expect(result.overallStats.creating).toBe(2); // Pod and Service
      expect(result.overallStats.unhealthy).toBe(1); // ConfigMap
      expect(result.overallStats.healthy).toBe(0);
    });

    it('handles resources without kind property', () => {
      const itemWithoutKind = createManagedResourceItem('Pod', [
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

    it('handles resources without status property', () => {
      const itemWithoutStatus = createManagedResourceItem('Pod');
      delete itemWithoutStatus.status;

      const result = calculateCrossplaneHoverData([itemWithoutStatus]);
      
      expect(result.resourceTypeStats).toHaveLength(1);
      expect(result.resourceTypeStats[0].type).toBe('Pod');
      expect(result.resourceTypeStats[0].unhealthy).toBe(1);
      expect(result.overallStats.unhealthy).toBe(1);
    });

    it('returns empty result for empty input', () => {
      const result = calculateCrossplaneHoverData([]);
      
      expect(result.resourceTypeStats).toHaveLength(0);
      expect(result.overallStats.total).toBe(0);
      expect(result.overallStats.healthy).toBe(0);
      expect(result.overallStats.creating).toBe(0);
      expect(result.overallStats.unhealthy).toBe(0);
    });

    it('correctly rounds percentages', () => {
      // Create 3 resources where 1 is healthy, resulting in 33.33...% 
      const items = [
        createManagedResourceItem('Pod', [
          createCondition('Ready', 'True'),
          createCondition('Synced', 'True'),
        ]),
        createManagedResourceItem('Pod', [
          createCondition('Ready', 'False'),
          createCondition('Synced', 'True'),
        ]),
        createManagedResourceItem('Pod', [
          createCondition('Ready', 'False'),
          createCondition('Synced', 'False'),
        ]),
      ];

      const result = calculateCrossplaneHoverData(items);
      
      const podStats = result.resourceTypeStats.find(s => s.type === 'Pod')!;
      // Should round 33.33...% to 33%
      expect(podStats.healthyPercentage).toBe(33);
      expect(podStats.creatingPercentage).toBe(33);
      expect(podStats.unhealthyPercentage).toBe(33);
    });
  });
});
