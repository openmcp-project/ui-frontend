import { renderHook } from '@testing-library/react';
import { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useFrontendConfig } from './FrontendConfigContext';
import { FeatureToggleProvider, useFeatureToggle } from './FeatureToggleContext';

vi.mock('./FrontendConfigContext', () => ({
  useFrontendConfig: vi.fn(),
}));

const mockUseFrontendConfig = (markMcpV1asDeprecated: boolean) => {
  vi.mocked(useFrontendConfig).mockReturnValue({
    featureToggles: { markMcpV1asDeprecated },
  } as ReturnType<typeof useFrontendConfig>);
};

describe('FeatureToggleContext', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useFeatureToggle', () => {
    it('should return feature toggles when used within provider', () => {
      // ARRANGE
      mockUseFrontendConfig(true);

      // ACT
      const { result } = renderHook(() => useFeatureToggle(), {
        wrapper: ({ children }: { children: ReactNode }) => <FeatureToggleProvider>{children}</FeatureToggleProvider>,
      });

      // ASSERT
      expect(result.current).toEqual({
        markMcpV1asDeprecated: true,
      });
    });

    it('should return false when toggle is false', () => {
      // ARRANGE
      mockUseFrontendConfig(false);

      // ACT
      const { result } = renderHook(() => useFeatureToggle(), {
        wrapper: ({ children }: { children: ReactNode }) => <FeatureToggleProvider>{children}</FeatureToggleProvider>,
      });

      // ASSERT
      expect(result.current.markMcpV1asDeprecated).toBe(false);
    });

    it('should throw error when used outside provider', () => {
      // ACT & ASSERT
      expect(() => {
        renderHook(() => useFeatureToggle());
      }).toThrow('useFeatureToggle must be used within a FeatureToggleProvider.');
    });
  });

  describe('FeatureToggleProvider', () => {
    it('should render children', () => {
      // ARRANGE
      mockUseFrontendConfig(false);

      // ACT
      const { result } = renderHook(() => useFeatureToggle(), {
        wrapper: ({ children }: { children: ReactNode }) => <FeatureToggleProvider>{children}</FeatureToggleProvider>,
      });

      // ASSERT
      expect(result.current).toBeDefined();
    });
  });
});
