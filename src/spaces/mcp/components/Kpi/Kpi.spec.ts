import { describe, it, expect } from 'vitest';
import type { KpiProps, KpiPropsEnabled, KpiPropsProgress } from './Kpi';
import { assertIsEnabled, assertIsProgress } from './Kpi';

describe('<Kpi>', () => {
  describe('assertIsProgress', () => {
    it('narrows type when kpiType is "progress"', () => {
      const kpiPropsProgress: KpiProps = {
        kpiType: 'progress',
        isLoading: false,
        progressValue: 42,
        progressLabel: 'Loading',
      };

      expect(() => assertIsProgress(kpiPropsProgress)).not.toThrow();

      // After assertion, kpi is KpiPropsProgress; failed narrowing triggers a compile-time error
      expect(kpiPropsProgress.progressValue).toBe(42);
    });

    it('throws when kpiType is not "progress"', () => {
      const kpi: KpiPropsEnabled = { kpiType: 'enabled' };

      expect(() => assertIsProgress(kpi)).toThrowError(
        "Assertion failed: Expected kpiType to be 'progress', but got 'enabled'.",
      );
    });
  });

  describe('assertIsEnabled', () => {
    it('narrows type when kpiType is "enabled"', () => {
      const kpi: KpiPropsEnabled = { kpiType: 'enabled' };

      expect(() => assertIsEnabled(kpi)).not.toThrow();

      // Type-level check: after assertion, kpi is KpiPropsEnabled
      // Accessing progress-only fields would be a TS error if uncommented.
      // @ts-expect-error - ensure narrowing prevents access to progress-only props
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      kpi.progressValue;
    });

    it('throws when kpiType is not "enabled"', () => {
      const kpiPropsProgress: KpiPropsProgress = {
        kpiType: 'progress',
        isLoading: true,
        progressValue: 100,
        progressLabel: 'Done',
      };

      expect(() => assertIsEnabled(kpiPropsProgress)).toThrowError(
        "Assertion failed: Expected kpiType to be 'enabled', but got 'progress'.",
      );
    });
  });
});
