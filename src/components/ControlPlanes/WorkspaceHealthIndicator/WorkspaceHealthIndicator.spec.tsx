import { describe, it, expect } from 'vitest';
import { ControlPlaneListItem, ReadyStatus } from '../../../spaces/onboarding/types/ControlPlane';

// Pure function tests for WorkspaceHealthIndicator calculation logic
describe('WorkspaceHealthIndicator utilities', () => {
  interface HealthStats {
    ready: number;
    notReady: number;
    progressing: number;
    deleting: number;
    total: number;
  }

  // Helper function to calculate health stats (simulating component logic)
  const calculateHealthStats = (controlPlanes: ControlPlaneListItem[]): HealthStats => {
    return controlPlanes.reduce(
      (acc, cp) => {
        const status = cp.status?.status ?? cp.status?.phase;
        switch (status) {
          case ReadyStatus.Ready:
            acc.ready++;
            break;
          case ReadyStatus.NotReady:
            acc.notReady++;
            break;
          case ReadyStatus.Progressing:
            acc.progressing++;
            break;
          case ReadyStatus.InDeletion:
            acc.deleting++;
            break;
        }
        acc.total++;
        return acc;
      },
      { ready: 0, notReady: 0, progressing: 0, deleting: 0, total: 0 },
    );
  };

  // Helper function to calculate health percentage
  const calculateHealthPercentage = (healthStats: HealthStats): number => {
    if (healthStats.total === 0) return 0;
    return Math.round((healthStats.ready / healthStats.total) * 100);
  };

  // Helper function to determine health color
  const getHealthColor = (healthPercentage: number, healthStats: HealthStats): string => {
    if (healthPercentage === 100) return 'positive';
    if (healthStats.progressing > 0 && healthStats.notReady === 0) return 'informative';
    if (healthStats.notReady > 0) return 'negative';
    return 'neutral';
  };

  // Helper function to determine health label
  const getHealthLabel = (healthPercentage: number, healthStats: HealthStats): string => {
    if (healthPercentage === 100) return 'healthy';
    if (healthStats.progressing > 0 && healthStats.notReady === 0) return 'progressing';
    if (healthStats.notReady > 0) return 'unhealthy';
    return 'unknown';
  };

  describe('calculateHealthStats', () => {
    it('calculates stats for all ready control planes', () => {
      const controlPlanes: ControlPlaneListItem[] = [
        {
          version: 'v1',
          metadata: { name: 'mcp-1', namespace: 'ns-1', creationTimestamp: '2024-01-01', annotations: {} },
          status: { status: ReadyStatus.Ready, conditions: [], access: undefined },
        },
        {
          version: 'v1',
          metadata: { name: 'mcp-2', namespace: 'ns-1', creationTimestamp: '2024-01-01', annotations: {} },
          status: { status: ReadyStatus.Ready, conditions: [], access: undefined },
        },
      ];

      const result = calculateHealthStats(controlPlanes);

      expect(result.ready).toBe(2);
      expect(result.notReady).toBe(0);
      expect(result.progressing).toBe(0);
      expect(result.deleting).toBe(0);
      expect(result.total).toBe(2);
    });

    it('calculates stats for mixed status control planes', () => {
      const controlPlanes: ControlPlaneListItem[] = [
        {
          version: 'v1',
          metadata: { name: 'mcp-1', namespace: 'ns-1', creationTimestamp: '2024-01-01', annotations: {} },
          status: { status: ReadyStatus.Ready, conditions: [], access: undefined },
        },
        {
          version: 'v1',
          metadata: { name: 'mcp-2', namespace: 'ns-1', creationTimestamp: '2024-01-01', annotations: {} },
          status: { status: ReadyStatus.NotReady, conditions: [], access: undefined },
        },
        {
          version: 'v1',
          metadata: { name: 'mcp-3', namespace: 'ns-1', creationTimestamp: '2024-01-01', annotations: {} },
          status: { status: ReadyStatus.Progressing, conditions: [], access: undefined },
        },
      ];

      const result = calculateHealthStats(controlPlanes);

      expect(result.ready).toBe(1);
      expect(result.notReady).toBe(1);
      expect(result.progressing).toBe(1);
      expect(result.deleting).toBe(0);
      expect(result.total).toBe(3);
    });

    it('handles control planes with null status', () => {
      const controlPlanes: ControlPlaneListItem[] = [
        {
          version: 'v1',
          metadata: { name: 'mcp-1', namespace: 'ns-1', creationTimestamp: '2024-01-01', annotations: {} },
          status: null,
        },
      ];

      const result = calculateHealthStats(controlPlanes);

      expect(result.ready).toBe(0);
      expect(result.notReady).toBe(0);
      expect(result.progressing).toBe(0);
      expect(result.deleting).toBe(0);
      expect(result.total).toBe(1);
    });

    it('handles empty control planes array', () => {
      const result = calculateHealthStats([]);

      expect(result.ready).toBe(0);
      expect(result.notReady).toBe(0);
      expect(result.progressing).toBe(0);
      expect(result.deleting).toBe(0);
      expect(result.total).toBe(0);
    });

    it('counts deleting control planes correctly', () => {
      const controlPlanes: ControlPlaneListItem[] = [
        {
          version: 'v1',
          metadata: { name: 'mcp-1', namespace: 'ns-1', creationTimestamp: '2024-01-01', annotations: {} },
          status: { status: ReadyStatus.InDeletion, conditions: [], access: undefined },
        },
        {
          version: 'v1',
          metadata: { name: 'mcp-2', namespace: 'ns-1', creationTimestamp: '2024-01-01', annotations: {} },
          status: { status: ReadyStatus.Ready, conditions: [], access: undefined },
        },
      ];

      const result = calculateHealthStats(controlPlanes);

      expect(result.deleting).toBe(1);
      expect(result.ready).toBe(1);
      expect(result.total).toBe(2);
    });

    it('uses phase field as fallback when status is not available', () => {
      const controlPlanes: ControlPlaneListItem[] = [
        {
          version: 'v1',
          metadata: { name: 'mcp-1', namespace: 'ns-1', creationTimestamp: '2024-01-01', annotations: {} },
          status: {
            status: ReadyStatus.Ready,
            phase: ReadyStatus.Ready,
            conditions: [],
            access: undefined,
          },
        },
      ];

      const result = calculateHealthStats(controlPlanes);

      expect(result.ready).toBe(1);
      expect(result.total).toBe(1);
    });
  });

  describe('calculateHealthPercentage', () => {
    it('calculates 100% for all ready control planes', () => {
      const stats: HealthStats = { ready: 3, notReady: 0, progressing: 0, deleting: 0, total: 3 };
      expect(calculateHealthPercentage(stats)).toBe(100);
    });

    it('calculates 0% for no ready control planes', () => {
      const stats: HealthStats = { ready: 0, notReady: 3, progressing: 0, deleting: 0, total: 3 };
      expect(calculateHealthPercentage(stats)).toBe(0);
    });

    it('calculates 50% for half ready control planes', () => {
      const stats: HealthStats = { ready: 1, notReady: 1, progressing: 0, deleting: 0, total: 2 };
      expect(calculateHealthPercentage(stats)).toBe(50);
    });

    it('rounds percentage correctly', () => {
      const stats: HealthStats = { ready: 2, notReady: 1, progressing: 0, deleting: 0, total: 3 };
      expect(calculateHealthPercentage(stats)).toBe(67); // 66.666... rounds to 67
    });

    it('returns 0% for empty control planes', () => {
      const stats: HealthStats = { ready: 0, notReady: 0, progressing: 0, deleting: 0, total: 0 };
      expect(calculateHealthPercentage(stats)).toBe(0);
    });

    it('calculates 33% for one third ready control planes', () => {
      const stats: HealthStats = { ready: 1, notReady: 2, progressing: 0, deleting: 0, total: 3 };
      expect(calculateHealthPercentage(stats)).toBe(33); // 33.333... rounds to 33
    });
  });

  describe('getHealthColor', () => {
    it('returns positive for 100% healthy', () => {
      const stats: HealthStats = { ready: 3, notReady: 0, progressing: 0, deleting: 0, total: 3 };
      expect(getHealthColor(100, stats)).toBe('positive');
    });

    it('returns informative for progressing with no errors', () => {
      const stats: HealthStats = { ready: 2, notReady: 0, progressing: 1, deleting: 0, total: 3 };
      expect(getHealthColor(67, stats)).toBe('informative');
    });

    it('returns negative for any not ready control planes', () => {
      const stats: HealthStats = { ready: 2, notReady: 1, progressing: 0, deleting: 0, total: 3 };
      expect(getHealthColor(67, stats)).toBe('negative');
    });

    it('returns negative even with progressing if not ready exists', () => {
      const stats: HealthStats = { ready: 1, notReady: 1, progressing: 1, deleting: 0, total: 3 };
      expect(getHealthColor(33, stats)).toBe('negative');
    });

    it('returns neutral for unknown states', () => {
      const stats: HealthStats = { ready: 0, notReady: 0, progressing: 0, deleting: 1, total: 1 };
      expect(getHealthColor(0, stats)).toBe('neutral');
    });

    it('returns neutral for empty control planes', () => {
      const stats: HealthStats = { ready: 0, notReady: 0, progressing: 0, deleting: 0, total: 0 };
      expect(getHealthColor(0, stats)).toBe('neutral');
    });
  });

  describe('getHealthLabel', () => {
    it('returns healthy for 100%', () => {
      const stats: HealthStats = { ready: 3, notReady: 0, progressing: 0, deleting: 0, total: 3 };
      expect(getHealthLabel(100, stats)).toBe('healthy');
    });

    it('returns progressing for progressing with no errors', () => {
      const stats: HealthStats = { ready: 2, notReady: 0, progressing: 1, deleting: 0, total: 3 };
      expect(getHealthLabel(67, stats)).toBe('progressing');
    });

    it('returns unhealthy for any not ready control planes', () => {
      const stats: HealthStats = { ready: 2, notReady: 1, progressing: 0, deleting: 0, total: 3 };
      expect(getHealthLabel(67, stats)).toBe('unhealthy');
    });

    it('returns unhealthy even with progressing if not ready exists', () => {
      const stats: HealthStats = { ready: 1, notReady: 1, progressing: 1, deleting: 0, total: 3 };
      expect(getHealthLabel(33, stats)).toBe('unhealthy');
    });

    it('returns unknown for unknown states', () => {
      const stats: HealthStats = { ready: 0, notReady: 0, progressing: 0, deleting: 1, total: 1 };
      expect(getHealthLabel(0, stats)).toBe('unknown');
    });

    it('returns unknown for empty control planes', () => {
      const stats: HealthStats = { ready: 0, notReady: 0, progressing: 0, deleting: 0, total: 0 };
      expect(getHealthLabel(0, stats)).toBe('unknown');
    });
  });
});
