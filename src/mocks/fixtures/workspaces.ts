import type { GetWorkspacesQuery } from '../../types/__generated__/graphql/graphql';

/**
 * Creates workspace fixtures for project `foo`, each including the given
 * `userEmail` as an admin member so the UI shows the control-plane list
 * instead of the "Request Access" banner.
 *
 * The email is resolved at request time (see the `GetWorkspaces` handler in
 * `handlers/onboarding.ts`) by calling the real `/api/auth/onboarding/me`
 * endpoint, so the fixtures work for any logged-in developer without
 * touching this file.
 */
export function createWorkspaces(userEmail: string): GetWorkspacesQuery {
  const member = {
    kind: 'User',
    name: userEmail,
    roles: ['admin'] as (string | null)[],
    namespace: null,
  };

  return {
    core_openmcp_cloud: {
      v1alpha1: {
        Workspaces: {
          items: [
            {
              apiVersion: 'core.openmcp.cloud/v1alpha1',
              kind: 'Workspace',
              metadata: {
                uid: 'ws-demo-uid',
                name: 'demo',
                namespace: 'project-foo',
                annotations: {},
              },
              spec: { members: [member] },
              status: { namespace: 'project-foo--ws-demo' },
            },
            {
              apiVersion: 'core.openmcp.cloud/v1alpha1',
              kind: 'Workspace',
              metadata: {
                uid: 'ws-staging-uid',
                name: 'staging',
                namespace: 'project-foo',
                annotations: {},
              },
              spec: { members: [member] },
              status: { namespace: 'project-foo--ws-staging' },
            },
          ],
        },
      },
    },
  };
}
