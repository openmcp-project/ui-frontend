import { describe, expect, it } from 'vitest';
import { resolveServiceMutationAction } from './resolveServiceMutationAction.ts';

describe('resolveServiceMutationAction', () => {
  it('creates a newly selected service in create mode', () => {
    expect(resolveServiceMutationAction(false, false, true)).toBe('create');
  });

  it('creates a newly selected service in edit mode when it was not previously installed', () => {
    expect(resolveServiceMutationAction(true, false, true)).toBe('create');
  });

  it('updates a selected service that was already installed in edit mode', () => {
    expect(resolveServiceMutationAction(true, true, true)).toBe('update');
  });

  it('deletes a deselected service that was previously installed in edit mode', () => {
    expect(resolveServiceMutationAction(true, true, false)).toBe('delete');
  });

  it('skips a deselected service that was never installed in edit mode', () => {
    expect(resolveServiceMutationAction(true, false, false)).toBe('skip');
  });

  it('skips an unselected service in create mode', () => {
    expect(resolveServiceMutationAction(false, false, false)).toBe('skip');
  });

  it('creates in create mode regardless of the wasInstalled flag', () => {
    expect(resolveServiceMutationAction(false, true, true)).toBe('create');
  });

  it('skips in create mode regardless of the wasInstalled flag when not selected', () => {
    expect(resolveServiceMutationAction(false, true, false)).toBe('skip');
  });
});
