import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CrossplaneProviderPicker } from './CrossplaneProviderPicker.tsx';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('CrossplaneProviderPicker', () => {
  it('renders providers alphabetically without mutating their input order', () => {
    const names = ['provider-kubernetes', 'provider-btp', 'provider-helm'];
    const providers = names.map((name) => ({ name, isSelected: true, selectedVersion: 'v1.0.0' }));
    const onToggle = vi.fn();
    const { container } = render(
      <CrossplaneProviderPicker
        providers={providers}
        catalog={names.map((name) => ({ name, versions: [{ version: 'v1.0.0' }] }))}
        onToggle={onToggle}
        onVersionChange={() => {}}
      />,
    );

    const checkboxes = container.querySelectorAll('ui5-checkbox');
    expect(Array.from(checkboxes, (checkbox) => checkbox.id)).toEqual([
      'provider-btp',
      'provider-helm',
      'provider-kubernetes',
    ]);
    expect(providers.map((provider) => provider.name)).toEqual(names);

    checkboxes[0].dispatchEvent(new CustomEvent('change', { bubbles: true }));
    expect(onToggle).toHaveBeenCalledWith('provider-btp');
  });
});
