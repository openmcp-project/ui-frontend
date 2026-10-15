import { act, renderHook } from '@testing-library/react';
import { useUpdateProject } from './useUpdateProject';
import { describe, it, expect, vi, afterEach, Mock, beforeEach } from 'vitest';
import { useMutation } from '@apollo/client/react';
import { MemberRoles } from '../../../lib/api/types/shared/members';
import {
  DISPLAY_NAME_ANNOTATION,
  SUPPORT_LANDSCAPE_ANNOTATION,
  SUPPORT_OPS_CONTACTS_ANNOTATION,
  SUPPORT_SECURITY_CONTACTS_ANNOTATION,
  SUPPORT_SERVICE_IDS_ANNOTATION,
} from '../../../lib/api/types/shared/keyNames';

vi.mock('../../../context/ToastContext', () => ({
  useToast: () => ({ show: vi.fn() }),
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock('@apollo/client/react', () => ({
  useMutation: vi.fn(),
}));

describe('useUpdateProject — wire shape', () => {
  let mutateMock: Mock;
  const useMutationMock = vi.mocked(useMutation);

  beforeEach(() => {
    mutateMock = vi.fn().mockResolvedValue({});
    useMutationMock.mockReturnValue([mutateMock, { loading: false }] as unknown as ReturnType<typeof useMutation>);
  });

  afterEach(() => vi.clearAllMocks());

  const baseParams = {
    name: 'existing-project',
    displayName: 'My Project',
    chargingTarget: '12345678-1234-1234-1234-123456789abc',
    chargingTargetType: 'btp',
    members: [{ name: 'user@domain.com', roles: [MemberRoles.admin], kind: 'User' as const }],
  };

  it('writes ALL five known annotation keys (support + display-name), even when unset — one map per PATCH', async () => {
    const { result } = renderHook(() => useUpdateProject());
    await act(async () => {
      await result.current.updateProject(baseParams);
    });

    expect(mutateMock).toHaveBeenCalledTimes(1);
    const annotations = mutateMock.mock.calls[0][0].variables.object.metadata.annotations;

    // These are the *only* annotation keys the client owns. Anything else on
    // the server-side Project resource (e.g. openmcp.cloud/created-by, or
    // labels set by controllers) is NOT in this map — whether it survives
    // the mutation depends on the GraphQL Gateway's merge semantics, not on
    // the client.
    expect(Object.keys(annotations).sort()).toEqual(
      [
        DISPLAY_NAME_ANNOTATION,
        SUPPORT_LANDSCAPE_ANNOTATION,
        SUPPORT_OPS_CONTACTS_ANNOTATION,
        SUPPORT_SECURITY_CONTACTS_ANNOTATION,
        SUPPORT_SERVICE_IDS_ANNOTATION,
      ].sort(),
    );
  });

  it('sends empty strings (not undefined, not absent) for unset support fields', async () => {
    const { result } = renderHook(() => useUpdateProject());
    await act(async () => {
      await result.current.updateProject(baseParams); // no supportX fields on params
    });

    const annotations = mutateMock.mock.calls[0][0].variables.object.metadata.annotations;

    // This is the critical shape for the "does the gateway preserve unknown
    // annotations?" question. Empty-string values may cause a naive merge
    // gateway to clear the corresponding annotation on the server — so if
    // that field ever gets set from another surface (e.g. kubectl), reopening
    // the edit dialog and saving would blank it. If the gateway treats
    // missing keys as "leave alone" this is fine.
    expect(annotations[SUPPORT_LANDSCAPE_ANNOTATION]).toBe('');
    expect(annotations[SUPPORT_SERVICE_IDS_ANNOTATION]).toBe('');
    expect(annotations[SUPPORT_SECURITY_CONTACTS_ANNOTATION]).toBe('');
    expect(annotations[SUPPORT_OPS_CONTACTS_ANNOTATION]).toBe('');
  });

  it('round-trips populated support fields verbatim', async () => {
    const { result } = renderHook(() => useUpdateProject());
    await act(async () => {
      await result.current.updateProject({
        ...baseParams,
        supportLandscape: 'production',
        supportServiceIds: 'ID-1, ID-2',
        supportSecurityContacts: 'mail:sec@example.com',
        supportOpsContacts: 'mail:ops@example.com',
      });
    });

    const annotations = mutateMock.mock.calls[0][0].variables.object.metadata.annotations;
    expect(annotations[SUPPORT_LANDSCAPE_ANNOTATION]).toBe('production');
    expect(annotations[SUPPORT_SERVICE_IDS_ANNOTATION]).toBe('ID-1, ID-2');
    expect(annotations[SUPPORT_SECURITY_CONTACTS_ANNOTATION]).toBe('mail:sec@example.com');
    expect(annotations[SUPPORT_OPS_CONTACTS_ANNOTATION]).toBe('mail:ops@example.com');
  });

  it('does NOT put unknown annotation keys onto the wire — client never mentions them', async () => {
    const { result } = renderHook(() => useUpdateProject());
    await act(async () => {
      await result.current.updateProject(baseParams);
    });

    const annotations = mutateMock.mock.calls[0][0].variables.object.metadata.annotations;

    // These are keys the server / controllers may set. The client MUST NOT
    // reference them so the gateway (which the team believes performs a
    // merge rather than a full replace) leaves them alone. This assertion
    // guards against a future regression that "helpfully" tries to be
    // exhaustive in the annotation map.
    expect(annotations['openmcp.cloud/created-by']).toBeUndefined();
    expect(annotations['meta.orchestrate.cloud.sap/managed-regions']).toBeUndefined();
  });
});
