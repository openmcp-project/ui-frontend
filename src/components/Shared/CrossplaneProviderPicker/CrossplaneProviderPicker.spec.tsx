import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CrossplaneProviderPicker } from './CrossplaneProviderPicker.tsx';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

afterEach(cleanup);

function buildProviders(names: string[]) {
  return names.map((name) => ({ name, isSelected: true, selectedVersion: 'v1.0.0' }));
}

function buildCatalog(names: string[]) {
  return names.map((name) => ({ name, versions: [{ version: 'v1.0.0' }] }));
}

describe('CrossplaneProviderPicker', () => {
  it('strips the "provider-" prefix from labels and sorts alphabetically without mutating input order', () => {
    const names = ['provider-kubernetes', 'provider-btp', 'provider-helm'];
    const providers = buildProviders(names);
    const onToggle = vi.fn();
    const { container } = render(
      <CrossplaneProviderPicker
        providers={providers}
        catalog={buildCatalog(names)}
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
    expect(Array.from(checkboxes, (checkbox) => checkbox.getAttribute('text'))).toEqual(['btp', 'helm', 'kubernetes']);
    expect(providers.map((provider) => provider.name)).toEqual(names);

    checkboxes[0].dispatchEvent(new CustomEvent('change', { bubbles: true }));
    expect(onToggle).toHaveBeenCalledWith('provider-btp');
  });

  it('reverses the order when the sort button is toggled', () => {
    const names = ['provider-kubernetes', 'provider-btp', 'provider-helm'];
    const providers = buildProviders(names);
    const { container } = render(
      <CrossplaneProviderPicker
        providers={providers}
        catalog={buildCatalog(names)}
        onToggle={() => {}}
        onVersionChange={() => {}}
      />,
    );

    const sortButton = container.querySelector('ui5-button');
    expect(sortButton).not.toBeNull();
    fireEvent(sortButton as Element, new CustomEvent('click', { bubbles: true }));

    const checkboxes = container.querySelectorAll('ui5-checkbox');
    expect(Array.from(checkboxes, (checkbox) => checkbox.id)).toEqual([
      'provider-kubernetes',
      'provider-helm',
      'provider-btp',
    ]);
  });

  it('filters the list via the search input', () => {
    const names = ['provider-kubernetes', 'provider-btp', 'provider-helm'];
    const providers = buildProviders(names);
    const { container } = render(
      <CrossplaneProviderPicker
        providers={providers}
        catalog={buildCatalog(names)}
        onToggle={() => {}}
        onVersionChange={() => {}}
      />,
    );

    const searchInput = container.querySelector('#provider-search') as HTMLInputElement & {
      value: string;
    };
    act(() => {
      searchInput.value = 'btp';
      searchInput.dispatchEvent(new CustomEvent('input', { bubbles: true }));
    });

    const checkboxes = container.querySelectorAll('ui5-checkbox');
    expect(Array.from(checkboxes, (checkbox) => checkbox.id)).toEqual(['provider-btp']);
  });

  it('shows an empty state when the search matches nothing', () => {
    const names = ['provider-kubernetes', 'provider-btp'];
    const providers = buildProviders(names);
    const { container, getByText } = render(
      <CrossplaneProviderPicker
        providers={providers}
        catalog={buildCatalog(names)}
        onToggle={() => {}}
        onVersionChange={() => {}}
      />,
    );

    const searchInput = container.querySelector('#provider-search') as HTMLInputElement & {
      value: string;
    };
    act(() => {
      searchInput.value = 'does-not-exist';
      searchInput.dispatchEvent(new CustomEvent('input', { bubbles: true }));
    });

    expect(container.querySelectorAll('ui5-checkbox')).toHaveLength(0);
    // eslint-disable-next-line jest-dom/prefer-in-document -- @testing-library/jest-dom is not installed in this project
    expect(getByText('ComponentInstallDialog.noProvidersFound')).not.toBeNull();
  });

  it('paginates the list, showing 5 providers per page', () => {
    const names = Array.from({ length: 7 }, (_, i) => `provider-${String(i).padStart(2, '0')}`);
    const providers = buildProviders(names);
    const { container } = render(
      <CrossplaneProviderPicker
        providers={providers}
        catalog={buildCatalog(names)}
        onToggle={() => {}}
        onVersionChange={() => {}}
      />,
    );

    expect(container.querySelectorAll('ui5-checkbox')).toHaveLength(5);

    const pageButtons = container.querySelectorAll('ui5-button');
    const nextButton = pageButtons[pageButtons.length - 1];
    fireEvent(nextButton, new CustomEvent('click', { bubbles: true }));

    expect(container.querySelectorAll('ui5-checkbox')).toHaveLength(2);
  });
});
