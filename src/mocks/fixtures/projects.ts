import type {
  CreateSelfSubjectRulesReviewMutation,
  CreateWorkspaceMutation,
  DeleteProjectMutation,
  DeleteWorkspaceMutation,
  GetProjectMembersQuery,
  GetProjectQuery,
  GetWorkspaceQuery,
  ProjectYamlQuery,
  UpdateProjectMutation,
  UpdateWorkspaceMutation,
  WorkspaceYamlQuery,
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

// __typename required so Apollo's type policies (CoreOpenmcpCloudQuery,
// CoreOpenmcpCloudV1alpha1Query, CoreOpenmcpCloudV1alpha1Project) activate and
// deep-merge the shared v1alpha1 cache slot instead of clobbering GetWorkspaces.
export const projectMembers = {
  core_openmcp_cloud: {
    __typename: 'CoreOpenmcpCloudQuery',
    v1alpha1: {
      __typename: 'CoreOpenmcpCloudV1alpha1Query',
      Project: {
        __typename: 'CoreOpenmcpCloudV1alpha1Project',
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
} as unknown as GetProjectMembersQuery;

const MOCK_MEMBER = { kind: 'User', name: 'dev@example.com', namespace: null, roles: ['admin'] };

export function getProject(name: string): GetProjectQuery {
  return {
    core_openmcp_cloud: {
      __typename: 'CoreOpenmcpCloudQuery',
      v1alpha1: {
        __typename: 'CoreOpenmcpCloudV1alpha1Query',
        Project: {
          __typename: 'CoreOpenmcpCloudV1alpha1Project',
          metadata: { uid: `project-${name}-uid`, name, annotations: {}, labels: {} },
          spec: { members: [MOCK_MEMBER] },
        },
      },
    },
  } as unknown as GetProjectQuery;
}

export function getWorkspace(name: string, namespace: string): GetWorkspaceQuery {
  return {
    core_openmcp_cloud: {
      __typename: 'CoreOpenmcpCloudQuery',
      v1alpha1: {
        __typename: 'CoreOpenmcpCloudV1alpha1Query',
        Workspace: {
          __typename: 'CoreOpenmcpCloudV1alpha1Workspace',
          metadata: { uid: `ws-${name}-uid`, name, namespace, annotations: {}, labels: {} },
          spec: { members: [MOCK_MEMBER] },
        },
      },
    },
  } as unknown as GetWorkspaceQuery;
}

export function projectYaml(name: string): ProjectYamlQuery {
  const yaml = [
    'apiVersion: core.openmcp.cloud/v1alpha1',
    'kind: Project',
    `metadata:`,
    `  name: ${name}`,
    'spec:',
    '  members:',
    '  - kind: User',
    '    name: dev@example.com',
    '    roles:',
    '    - admin',
  ].join('\n');
  return {
    core_openmcp_cloud: {
      __typename: 'CoreOpenmcpCloudQuery',
      v1alpha1: { __typename: 'CoreOpenmcpCloudV1alpha1Query', ProjectYaml: yaml },
    },
  } as unknown as ProjectYamlQuery;
}

export function workspaceYaml(name: string, namespace: string): WorkspaceYamlQuery {
  const yaml = [
    'apiVersion: core.openmcp.cloud/v1alpha1',
    'kind: Workspace',
    'metadata:',
    `  name: ${name}`,
    `  namespace: ${namespace}`,
    'spec:',
    '  members:',
    '  - kind: User',
    '    name: dev@example.com',
    '    roles:',
    '    - admin',
  ].join('\n');
  return {
    core_openmcp_cloud: {
      __typename: 'CoreOpenmcpCloudQuery',
      v1alpha1: { __typename: 'CoreOpenmcpCloudV1alpha1Query', WorkspaceYaml: yaml },
    },
  } as unknown as WorkspaceYamlQuery;
}

export function createWorkspaceResult(name: string, namespace: string): CreateWorkspaceMutation {
  return {
    core_openmcp_cloud: {
      v1alpha1: { createWorkspace: { metadata: { uid: `ws-${name}-uid`, name, namespace } } },
    },
  };
}

export function updateWorkspaceResult(name: string, namespace: string): UpdateWorkspaceMutation {
  return {
    core_openmcp_cloud: {
      v1alpha1: { updateWorkspace: { metadata: { uid: `ws-${name}-uid`, name, namespace } } },
    },
  };
}

export const deleteWorkspaceResult: DeleteWorkspaceMutation = {
  core_openmcp_cloud: { v1alpha1: { deleteWorkspace: true } },
};

export function updateProjectResult(name: string): UpdateProjectMutation {
  return {
    core_openmcp_cloud: {
      v1alpha1: { updateProject: { metadata: { uid: `project-${name}-uid`, name } } },
    },
  };
}

export const deleteProjectResult: DeleteProjectMutation = {
  core_openmcp_cloud: { v1alpha1: { deleteProject: true } },
};
