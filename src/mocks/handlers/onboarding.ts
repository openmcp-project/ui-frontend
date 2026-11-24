import { graphql, HttpResponse } from 'msw';
import {
  createProjectResult,
  deleteProjectResult,
  deleteWorkspaceResult,
  createWorkspaceResult,
  getProject,
  getWorkspace,
  projectMembers,
  projectYaml,
  selfSubjectRulesReview,
  updateProjectResult,
  updateWorkspaceResult,
  workspaceYaml,
} from '../fixtures/projects';
import { createWorkspaces } from '../fixtures/workspaces';
import {
  createManagedControlPlaneResult,
  createMcpsList,
  createMcpsNames,
  updateManagedControlPlaneResult,
} from '../fixtures/controlPlanes';
import { managedComponents } from '../fixtures/components';

// Scope to the single GraphQL endpoint; every other request bypasses to the real BFF.
const api = graphql.link('/api/graphql');

// Cache the in-flight Promise so concurrent GetWorkspaces handler invocations
// (React StrictMode double-mount, polling refetches) all share the same fetch
// instead of each firing a separate request to /api/auth/onboarding/me.
// In mock mode this call is intercepted by the authHandlers MSW handler and
// returns { user: { email: 'mock@example.com' } } without hitting the network.
// Limitation: the cache is never invalidated within a session. If you log out
// and back in as a different user, reload the page — otherwise the old email
// persists and the workspace member check may resolve incorrectly.
let emailPromise: Promise<string> | null = null;

async function resolveUserEmail(): Promise<string> {
  if (emailPromise !== null) return emailPromise;
  emailPromise = (async () => {
    try {
      const res = await fetch('/api/auth/onboarding/me');
      if (res.ok) {
        const body = (await res.json()) as { user?: { email?: string } };
        return body?.user?.email ?? 'mock@example.com';
      }
      return 'mock@example.com';
    } catch {
      return 'mock@example.com';
    }
  })();
  return emailPromise;
}

export const onboardingHandlers = [
  api.mutation('CreateSelfSubjectRulesReview', () => HttpResponse.json({ data: selfSubjectRulesReview })),
  api.query('GetProjectMembers', () => HttpResponse.json({ data: projectMembers })),

  // Dynamically inject the logged-in developer's email as a workspace member so
  // the UI shows the control-plane list instead of the "Request Access" banner.
  // The `/api/auth/onboarding/me` call is real (REST not mocked); MSW bypasses it.
  // Email is fetched once and cached — repeated queries reuse the cached value to
  // avoid hitting the BFF rate limit on this endpoint.
  api.query('GetWorkspaces', async () => {
    const userEmail = await resolveUserEmail();
    return HttpResponse.json({ data: createWorkspaces(userEmail) });
  }),

  // Namespace-aware so each workspace shows its own set of control planes.
  api.query('GetMCPsList', ({ variables }) => {
    const { workspaceNamespace } = variables as { workspaceNamespace: string };
    return HttpResponse.json({ data: createMcpsList(workspaceNamespace) });
  }),
  api.query('GetMCPsNames', ({ variables }) => {
    const { workspaceNamespace } = variables as { workspaceNamespace: string };
    return HttpResponse.json({ data: createMcpsNames(workspaceNamespace) });
  }),

  // ── Project detail & YAML ────────────────────────────────────────────────
  api.query('GetProject', ({ variables }) => {
    const { name } = variables as { name: string };
    return HttpResponse.json({ data: getProject(name) });
  }),

  api.query('ProjectYaml', ({ variables }) => {
    const { name } = variables as { name: string };
    return HttpResponse.json({ data: projectYaml(name) });
  }),

  // ── Workspace detail & YAML ──────────────────────────────────────────────
  api.query('GetWorkspace', ({ variables }) => {
    const { name, namespace } = variables as { name: string; namespace: string };
    return HttpResponse.json({ data: getWorkspace(name, namespace) });
  }),

  api.query('WorkspaceYaml', ({ variables }) => {
    const { name, namespace } = variables as { name: string; namespace?: string };
    return HttpResponse.json({ data: workspaceYaml(name, namespace ?? 'project-foo') });
  }),

  // ── Create-CP wizard ─────────────────────────────────────────────────────
  api.query('GetManagedComponents', () => HttpResponse.json({ data: managedComponents })),

  api.mutation('CreateManagedControlPlane', ({ variables }) => {
    const { namespace, object } = variables as { namespace: string; object: { metadata?: { name?: string } } };
    const name = object?.metadata?.name ?? 'new-cp';
    return HttpResponse.json({ data: createManagedControlPlaneResult(name, namespace) });
  }),

  api.mutation('UpdateManagedControlPlane', ({ variables }) => {
    const { name, namespace } = variables as { name: string; namespace: string };
    return HttpResponse.json({ data: updateManagedControlPlaneResult(name, namespace ?? '') });
  }),

  // ── Workspace CRUD ───────────────────────────────────────────────────────
  api.mutation('CreateWorkspace', ({ variables }) => {
    const { namespace, object } = variables as { namespace: string; object: { metadata?: { name?: string } } };
    const name = object?.metadata?.name ?? 'new-workspace';
    return HttpResponse.json({ data: createWorkspaceResult(name, namespace) });
  }),

  api.mutation('UpdateWorkspace', ({ variables }) => {
    const { name, namespace } = variables as { name: string; namespace: string };
    return HttpResponse.json({ data: updateWorkspaceResult(name, namespace) });
  }),

  api.mutation('DeleteWorkspace', () => HttpResponse.json({ data: deleteWorkspaceResult })),

  // ── Project CRUD ─────────────────────────────────────────────────────────
  api.mutation('CreateProject', ({ variables }) => {
    const { object } = variables as { object: { metadata?: { name?: string } } };
    const name = object?.metadata?.name ?? 'new-project';
    return HttpResponse.json({ data: createProjectResult(name) });
  }),

  api.mutation('UpdateProject', ({ variables }) => {
    const { name } = variables as { name: string };
    return HttpResponse.json({ data: updateProjectResult(name) });
  }),

  api.mutation('DeleteProject', () => HttpResponse.json({ data: deleteProjectResult })),
];
