import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TagListInput } from './TagListInput';

// jsdom + UI5 web components don't paint tokens the way a real browser
// does — we mount the component and drive its internal input directly.
// The Cypress spec exercises the full UI5 rendering path; here we just
// pin the split/join contract that the popover + wire depend on.

describe('TagListInput', () => {
  it('renders one Token per non-empty comma-separated entry, trimming whitespace', () => {
    const { container } = render(<TagListInput value="a, b ,  c" onChange={() => {}} />);
    const tokens = container.querySelectorAll('ui5-token');
    expect(tokens).toHaveLength(3);
    expect(Array.from(tokens).map((t) => (t as HTMLElement & { text: string }).text)).toEqual(['a', 'b', 'c']);
  });

  it('renders no Tokens when the value is empty', () => {
    const { container } = render(<TagListInput value="" onChange={() => {}} />);
    expect(container.querySelectorAll('ui5-token')).toHaveLength(0);
  });

  it('emits a comma-joined string when a new token is added via the change event', () => {
    const onChange = vi.fn();
    const { container } = render(<TagListInput data-testid="ids" value="ID-1" onChange={onChange} />);

    const multiInput = container.querySelector('ui5-multi-input') as HTMLElement & { value: string };
    multiInput.value = 'ID-2';
    multiInput.dispatchEvent(new CustomEvent('change', { bubbles: true }));

    expect(onChange).toHaveBeenCalledWith('ID-1, ID-2');
  });

  it('splits a pasted comma-separated batch into distinct tokens on commit', () => {
    const onChange = vi.fn();
    const { container } = render(<TagListInput value="" onChange={onChange} />);

    const multiInput = container.querySelector('ui5-multi-input') as HTMLElement & { value: string };
    multiInput.value = 'a,b, c';
    multiInput.dispatchEvent(new CustomEvent('change', { bubbles: true }));

    expect(onChange).toHaveBeenCalledWith('a, b, c');
  });

  it('deduplicates when a token that already exists is added again', () => {
    const onChange = vi.fn();
    const { container } = render(<TagListInput value="ID-1" onChange={onChange} />);
    const multiInput = container.querySelector('ui5-multi-input') as HTMLElement & { value: string };
    multiInput.value = 'ID-1';
    multiInput.dispatchEvent(new CustomEvent('change', { bubbles: true }));
    expect(onChange).toHaveBeenCalledWith('ID-1');
  });

  // Sanity: the component actually renders — this guards the placeholder
  // wiring we added for i18n keys.
  it('forwards placeholder + testid onto the MultiInput', () => {
    render(<TagListInput data-testid="my-tags" placeholder="Type and press Enter" value="" onChange={() => {}} />);
    const el = screen.getByTestId('my-tags');
    expect((el as HTMLElement & { placeholder: string }).placeholder).toBe('Type and press Enter');
  });
});
