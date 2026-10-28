import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MatomoAdapter } from './MatomoAdapter';
import { toVirtualPage } from '../pageView/virtualPage';

describe('MatomoAdapter.pageView', () => {
  const push = vi.fn();

  beforeEach(() => {
    window._paq = { push };
  });

  afterEach(() => {
    delete window._paq;
    push.mockReset();
  });

  it('sets the virtual page as custom URL before tracking the page view', () => {
    new MatomoAdapter().pageView(toVirtualPage('/projects/webapp-playground', ''));

    expect(push.mock.calls).toEqual([[['setCustomUrl', '/projects/:projectName']], [['trackPageView']]]);
  });

  it('is a no-op when the Matomo bootstrap is absent', () => {
    delete window._paq;

    expect(() => new MatomoAdapter().pageView(toVirtualPage('/projects', ''))).not.toThrow();
  });
});
