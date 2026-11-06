import { renderHook } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { useDocumentTitle } from './useDocumentTitle';

describe('useDocumentTitle', () => {
  afterEach(() => {
    document.title = '';
  });

  it('sets the document title with the base suffix when a title is given', () => {
    renderHook(() => useDocumentTitle('My Project'));

    expect(document.title).toBe('My Project — Control Plane UI');
  });

  it('falls back to the base title when no title is given', () => {
    renderHook(() => useDocumentTitle());

    expect(document.title).toBe('Control Plane UI');
  });

  it('updates the title when the value changes', () => {
    const { rerender } = renderHook(({ title }: { title?: string }) => useDocumentTitle(title), {
      initialProps: { title: 'First' },
    });
    expect(document.title).toBe('First — Control Plane UI');

    rerender({ title: 'Second' });

    expect(document.title).toBe('Second — Control Plane UI');
  });

  it('resets the title back to the base title on unmount', () => {
    const { unmount } = renderHook(() => useDocumentTitle('My Control Plane'));
    expect(document.title).toBe('My Control Plane — Control Plane UI');

    unmount();

    expect(document.title).toBe('Control Plane UI');
  });
});
