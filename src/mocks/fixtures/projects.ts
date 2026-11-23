import type {
  CreateSelfSubjectRulesReviewMutation,
  GetProjectMembersQuery,
} from '../../types/__generated__/graphql/graphql';

/** Projects the mocked user can "see" on the `/projects` landing page. */
export const PROJECT_NAMES = ['foo', 'bar'];

/**
 * `useProjectsQuery` derives the visible project names from a
 * `SelfSubjectRulesReview`: it keeps `resourceNames` of any rule granting
 * `get` on `projects` in `core.openmcp.cloud`.
 */
export const selfSubjectRulesReview: CreateSelfSubjectRulesReviewMutation = {
  authorization_k8s_io: {
    v1: {
      createSelfSubjectRulesReview: {
        status: {
          evaluationError: null,
          incomplete: false,
          resourceRules: [
            {
              apiGroups: ['core.openmcp.cloud'],
              resources: ['projects'],
              verbs: ['get'],
              resourceNames: PROJECT_NAMES,
            },
          ],
        },
      },
    },
  },
};

export const projectMembers: GetProjectMembersQuery = {
  core_openmcp_cloud: {
    v1alpha1: {
      Project: {
        metadata: {
          uid: 'project-foo-uid',
          creationTimestamp: '2026-01-01T00:00:00Z',
          annotations: {},
        },
        spec: {
          members: [{ kind: 'User', name: 'dev@example.com', namespace: null, roles: ['admin'] }],
        },
      },
    },
  },
};
