import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
  isProviderComponent,
  findInitialSelection,
  findOriginalName,
  determineSelectedVersion,
  mapToComponentsListItem,
  addCustomProviders,
  sortComponents,
  buildComponentsList,
  validateTemplateDefaults,
  useComponentsSelectionData,
  InitialSelection,
} from './useComponentsSelectionData.ts';
import { ManagedControlPlaneTemplate } from '../../../lib/api/types/templates/mcpTemplate.ts';
import { ManagedComponent } from '../../../lib/api/types/crate/listManagedComponents.ts';
import { ComponentsListItem } from '../../../lib/api/types/crate/createManagedControlPlane.ts';

const createManagedComponent = (name: string, versions: string[]): ManagedComponent => ({
  apiVersion: 'core.openmcp.cloud/v1alpha1',
  kind: 'ManagedComponent',
  metadata: { name },
  spec: {},
  status: { versions },
});

const createTemplate = (defaultComponents: { name: string; version: string }[]): ManagedControlPlaneTemplate =>
  ({
    apiVersion: 'core.openmcp.cloud/v1alpha1',
    kind: 'ManagedControlPlaneTemplate',
    metadata: { name: 'test-template', namespace: 'default' },
    spec: {
      meta: {
        chargingTarget: { type: 'BTP', value: '' },
        displayName: {},
        name: {},
      },
      spec: {
        authentication: { system: { changeable: true, enabled: true } },
        authorization: { defaultMembers: [] },
        components: { defaultComponents },
      },
    },
  }) as ManagedControlPlaneTemplate;

const createComponentsListItem = (name: string, isProvider = false): ComponentsListItem => ({
  name,
  versions: [],
  selectedVersion: '',
  isSelected: false,
  documentationUrl: '',
  isProvider,
});

const sampleInitialSelection: InitialSelection = {
  crossplane: { isSelected: true, version: '1.20.1' },
  'custom-provider': { isSelected: true, version: '1.0.0' },
  kubernetes: { isSelected: true, version: '0.15.0' },
  btp: { isSelected: true, version: '1.2.2' },
  flux: { isSelected: true, version: '2.16.2' },
};

const sampleItems: ManagedComponent[] = [
  createManagedComponent('cert-manager', ['1.13.1', '1.16.1']),
  createManagedComponent('crossplane', ['1.15.0', '1.19.0', '1.20.1']),
  createManagedComponent('flux', ['2.15.0', '2.16.2']),
  createManagedComponent('kyverno', ['3.2.4', '3.5.2']),
  createManagedComponent('provider-btp', ['1.0.0', '1.2.2', '1.4.0']),
  createManagedComponent('provider-kubernetes', ['0.14.0', '0.15.0']),
];

describe('isProviderComponent', () => {
  it('returns true for provider-* names, false for crossplane and others', () => {
    expect(isProviderComponent('provider-btp')).toBe(true);
    expect(isProviderComponent('crossplane')).toBe(false);
    expect(isProviderComponent('flux')).toBe(false);
  });
});

describe('findInitialSelection', () => {
  it('finds by exact name or without provider- prefix', () => {
    expect(findInitialSelection('crossplane', sampleInitialSelection)?.version).toBe('1.20.1');
    expect(findInitialSelection('provider-btp', sampleInitialSelection)?.version).toBe('1.2.2');
    expect(findInitialSelection('non-existent', sampleInitialSelection)).toBeUndefined();
  });
});

describe('findOriginalName', () => {
  it('returns undefined when initialSelection is undefined', () => {
    expect(findOriginalName('crossplane', undefined)).toBeUndefined();
  });

  it('returns the exact name when it exists in initialSelection', () => {
    expect(findOriginalName('crossplane', sampleInitialSelection)).toBe('crossplane');
    expect(findOriginalName('flux', sampleInitialSelection)).toBe('flux');
  });

  it('returns name without provider- prefix when that exists in initialSelection', () => {
    expect(findOriginalName('provider-btp', sampleInitialSelection)).toBe('btp');
    expect(findOriginalName('provider-kubernetes', sampleInitialSelection)).toBe('kubernetes');
  });

  it('returns undefined when name does not exist in initialSelection', () => {
    expect(findOriginalName('non-existent', sampleInitialSelection)).toBeUndefined();
    expect(findOriginalName('provider-unknown', sampleInitialSelection)).toBeUndefined();
  });

  it('returns exact name when both exact and prefixed versions could match', () => {
    const selectionWithBoth: InitialSelection = {
      'provider-test': { isSelected: true, version: '1.0.0' },
      test: { isSelected: true, version: '2.0.0' },
    };
    // Exact match takes priority
    expect(findOriginalName('provider-test', selectionWithBoth)).toBe('provider-test');
  });

  it('handles names that do not start with provider- prefix', () => {
    // When the name doesn't have provider- prefix, nameWithoutPrefix equals name
    // so the second condition is skipped
    expect(findOriginalName('crossplane', sampleInitialSelection)).toBe('crossplane');
  });
});

describe('determineSelectedVersion', () => {
  const versions = ['1.20.1', '1.19.0', '1.18.0'];

  it('prioritizes: initial selection > template default > first available', () => {
    const initSel = { isSelected: true, version: '1.19.0' };
    const templateDefault = { name: 'test', version: '1.18.0' };

    expect(determineSelectedVersion(versions, initSel, templateDefault)).toBe('1.19.0');
    expect(determineSelectedVersion(versions, undefined, templateDefault)).toBe('1.18.0');
    expect(determineSelectedVersion(versions, undefined, undefined)).toBe('1.20.1');
  });

  it('returns initial selection version even if not in versions array', () => {
    const initSel = { isSelected: true, version: '9.9.9' };
    expect(determineSelectedVersion(versions, initSel, undefined)).toBe('9.9.9');
  });
});

describe('mapToComponentsListItem', () => {
  it('maps component with sorted versions and applies initial selection', () => {
    const item = createManagedComponent('crossplane', ['1.15.0', '1.20.1', '1.19.0']);
    const initialSelection: InitialSelection = {
      crossplane: { isSelected: true, version: '1.19.0' },
    };

    const result = mapToComponentsListItem(item, initialSelection, undefined);

    expect(result.versions).toEqual(['1.20.1', '1.19.0', '1.15.0']);
    expect(result.selectedVersion).toBe('1.19.0');
    expect(result.isSelected).toBe(true);
    expect(result.isProvider).toBe(false);
  });

  it('adds initial selection version to versions array if not present', () => {
    const item = createManagedComponent('crossplane', ['1.15.0', '1.19.0']);
    const initialSelection: InitialSelection = {
      crossplane: { isSelected: true, version: '1.20.1' },
    };

    const result = mapToComponentsListItem(item, initialSelection, undefined);

    expect(result.versions).toContain('1.20.1');
    expect(result.versions).toEqual(['1.20.1', '1.19.0', '1.15.0']);
    expect(result.selectedVersion).toBe('1.20.1');
  });

  it('applies template default when no initial selection', () => {
    const item = createManagedComponent('flux', ['2.15.0', '2.16.2']);
    const template = createTemplate([{ name: 'flux', version: '2.15.0' }]);

    const result = mapToComponentsListItem(item, undefined, template);

    expect(result.selectedVersion).toBe('2.15.0');
    expect(result.isSelected).toBe(true);
  });

  it('sets originalName to btp for provider-btp when initial selection uses btp', () => {
    const item = createManagedComponent('provider-btp', ['1.0.0', '1.2.2']);
    const initialSelection: InitialSelection = { btp: { isSelected: true, version: '1.2.2' } };

    const result = mapToComponentsListItem(item, initialSelection, undefined);

    expect(result.name).toBe('provider-btp');
    expect(result.originalName).toBe('btp');
  });
});

describe('addCustomProviders', () => {
  it('adds providers from initial selection not in available components', () => {
    const components = [createComponentsListItem('crossplane')];
    const initialSelection: InitialSelection = {
      'custom-provider': { isSelected: true, version: '1.0.0' },
    };

    const result = addCustomProviders(components, initialSelection);

    expect(result).toHaveLength(2);
    expect(result[1].name).toBe('custom-provider');
    expect(result[1].isProvider).toBe(true);
  });

  it('skips if provider already exists or is not selected', () => {
    const components = [createComponentsListItem('provider-btp', true)];

    expect(addCustomProviders(components, { 'provider-btp': { isSelected: true, version: '1.0.0' } })).toHaveLength(1);
    expect(addCustomProviders(components, { btp: { isSelected: true, version: '1.0.0' } })).toHaveLength(1);
    expect(addCustomProviders([], { test: { isSelected: false, version: '1.0.0' } })).toHaveLength(0);
  });
});

describe('sortComponents', () => {
  it('places providers after crossplane, both groups alphabetically', () => {
    const components = [
      createComponentsListItem('flux'),
      createComponentsListItem('crossplane'),
      createComponentsListItem('provider-kubernetes', true),
      createComponentsListItem('provider-btp', true),
    ];

    const result = sortComponents(components);

    expect(result.map((c) => c.name)).toEqual(['crossplane', 'provider-btp', 'provider-kubernetes', 'flux']);
  });
});

describe('buildComponentsList', () => {
  it('builds complete list: maps, filters cert-manager, adds custom providers, sorts', () => {
    const result = buildComponentsList(sampleItems, sampleInitialSelection, undefined);

    expect(result.find((c) => c.name === 'cert-manager')).toBeUndefined();
    expect(result.find((c) => c.name === 'custom-provider')).toBeDefined();
    expect(result[0].name).toBe('crossplane');

    const crossplane = result.find((c) => c.name === 'crossplane');
    expect(crossplane?.isSelected).toBe(true);
    expect(crossplane?.selectedVersion).toBe('1.20.1');

    const providerBtp = result.find((c) => c.name === 'provider-btp');
    expect(providerBtp?.selectedVersion).toBe('1.2.2');
  });

  it('returns empty array for empty items', () => {
    expect(buildComponentsList([], undefined, undefined)).toEqual([]);
  });
});

describe('validateTemplateDefaults', () => {
  it('returns null for valid defaults or empty inputs', () => {
    const validTemplate = createTemplate([{ name: 'crossplane', version: '1.20.1' }]);

    expect(validateTemplateDefaults(sampleItems, validTemplate)).toBeNull();
    expect(validateTemplateDefaults([], validTemplate)).toBeNull();
    expect(validateTemplateDefaults(sampleItems, undefined)).toBeNull();
  });

  it('returns error messages for missing component or version', () => {
    const missingComponent = createTemplate([{ name: 'non-existent', version: '1.0.0' }]);
    const missingVersion = createTemplate([{ name: 'crossplane', version: '99.99.99' }]);

    expect(validateTemplateDefaults(sampleItems, missingComponent)).toContain('non-existent');
    expect(validateTemplateDefaults(sampleItems, missingVersion)).toContain('99.99.99');
  });
});

describe('useComponentsSelectionData', () => {
  const mockSetValue = vi.fn();
  const mockOnComponentsInitialized = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls setValue with built components list and onComponentsInitialized callback', async () => {
    const mockUseComponentsQuery = vi.fn().mockReturnValue({
      components: { items: sampleItems },
      error: undefined,
      isLoading: false,
    });

    renderHook(() =>
      useComponentsSelectionData(
        undefined,
        sampleInitialSelection,
        mockSetValue,
        mockOnComponentsInitialized,
        mockUseComponentsQuery,
      ),
    );

    await waitFor(() => {
      expect(mockSetValue).toHaveBeenCalledWith('componentsList', expect.any(Array), { shouldValidate: false });
      expect(mockOnComponentsInitialized).toHaveBeenCalled();
    });
  });

  it('returns loading and error states from query', () => {
    const mockError = new Error('Test error');
    const mockUseComponentsQuery = vi.fn().mockReturnValue({
      components: undefined,
      error: mockError,
      isLoading: true,
    });

    const { result } = renderHook(() =>
      useComponentsSelectionData(undefined, undefined, mockSetValue, undefined, mockUseComponentsQuery),
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBe(mockError);
  });

  it('returns templateDefaultsError for invalid template defaults', async () => {
    const invalidTemplate = createTemplate([{ name: 'non-existent', version: '1.0.0' }]);
    const mockUseComponentsQuery = vi.fn().mockReturnValue({
      components: { items: sampleItems },
      error: undefined,
      isLoading: false,
    });

    const { result } = renderHook(() =>
      useComponentsSelectionData(invalidTemplate, undefined, mockSetValue, undefined, mockUseComponentsQuery),
    );

    await waitFor(() => {
      expect(result.current.templateDefaultsError).toContain('non-existent');
    });
  });
});
