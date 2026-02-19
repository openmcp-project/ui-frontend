import { renderHook } from '@testing-library/react';
import { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { FeatureToggleProvider, useFeatureToggle } from './FeatureToggleContext';

describe('FeatureToggleContext', () => {
  // Store original import.meta.env to restore after tests
  const originalEnv = { ...import.meta.env };

  afterEach(() => {
    // Restore original environment
    Object.assign(import.meta.env, originalEnv);
  });

  describe('useFeatureToggle', () => {
    it('should return feature toggles when used within provider', () => {
      // ARRANGE
      (import.meta.env as Record<string, string>).VITE_MARK_MCP_V1_AS_DEPRECATED = 'true';

      // ACT
      const { result } = renderHook(() => useFeatureToggle(), {
        wrapper: ({ children }: { children: ReactNode }) => <FeatureToggleProvider>{children}</FeatureToggleProvider>,
      });

      // ASSERT
      expect(result.current).toEqual({
        mark_mcp_v1_as_deprecated: true,
      });
    });

    it('should return false when env variable is not "true"', () => {
      // ARRANGE
      (import.meta.env as Record<string, string>).VITE_MARK_MCP_V1_AS_DEPRECATED = 'false';

      // ACT
      const { result } = renderHook(() => useFeatureToggle(), {
        wrapper: ({ children }: { children: ReactNode }) => <FeatureToggleProvider>{children}</FeatureToggleProvider>,
      });

      // ASSERT
      expect(result.current.mark_mcp_v1_as_deprecated).toBe(false);
    });

    it('should return false when env variable is undefined', () => {
      // ARRANGE
      delete (import.meta.env as Record<string, string>).VITE_MARK_MCP_V1_AS_DEPRECATED;

      // ACT
      const { result } = renderHook(() => useFeatureToggle(), {
        wrapper: ({ children }: { children: ReactNode }) => <FeatureToggleProvider>{children}</FeatureToggleProvider>,
      });

      // ASSERT
      expect(result.current.mark_mcp_v1_as_deprecated).toBe(false);
    });

    it('should return false when env variable has unexpected value', () => {
      // ARRANGE
      (import.meta.env as Record<string, string>).VITE_MARK_MCP_V1_AS_DEPRECATED = 'yes';

      // ACT
      const { result } = renderHook(() => useFeatureToggle(), {
        wrapper: ({ children }: { children: ReactNode }) => <FeatureToggleProvider>{children}</FeatureToggleProvider>,
      });

      // ASSERT
      expect(result.current.mark_mcp_v1_as_deprecated).toBe(false);
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
      // ACT
      const { result } = renderHook(() => useFeatureToggle(), {
        wrapper: ({ children }: { children: ReactNode }) => <FeatureToggleProvider>{children}</FeatureToggleProvider>,
      });

      // ASSERT
      expect(result.current).toBeDefined();
    });
  });
});
