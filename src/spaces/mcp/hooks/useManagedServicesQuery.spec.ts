import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { GetManagedServicesQuery } from '../../../types/__generated__/graphql/graphql.ts';
import { useManagedServicesQuery } from './useManagedServicesQuery.ts';

const { useQueryMock } = vi.hoisted(() => ({ useQueryMock: vi.fn() }));

vi.mock('@apollo/client/react', () => ({ useQuery: useQueryMock }));

describe('useManagedServicesQuery', () => {
  it('sorts service and provider versions newest first without changing the catalog', () => {
    const versions = [{ version: 'v1.9.0' }, null, { version: '1.10.0' }, { version: 'v2.0.0-10' }];
    const data: GetManagedServicesQuery = {
      open_control_plane_io: {
        v1: {
          ManagedService: {
            apiVersion: null,
            kind: null,
            metadata: null,
            spec: {
              services: [{ name: 'crossplane', kind: 'Crossplane', apiVersion: null, versions }],
              crossplaneProviders: [{ name: 'provider-btp', versions }],
            },
          },
        },
      },
    };
    useQueryMock.mockReturnValue({ data, loading: false, error: undefined });

    const { result } = renderHook(() => useManagedServicesQuery());
    const expected = [{ version: 'v2.0.0-10' }, { version: '1.10.0' }, { version: 'v1.9.0' }];
    expect(result.current.services[0].versions).toEqual(expected);
    expect(result.current.crossplaneProviders[0].versions).toEqual(expected);
    expect(versions).toEqual([{ version: 'v1.9.0' }, null, { version: '1.10.0' }, { version: 'v2.0.0-10' }]);
  });
});
