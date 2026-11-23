import { graphql, HttpResponse } from 'msw';
import { projectMembers, selfSubjectRulesReview } from '../fixtures/projects';
import { createWorkspaces } from '../fixtures/workspaces';
import { createMcpsList, createMcpsNames } from '../fixtures/controlPlanes';

// Scope to the single GraphQL endpoint; every other request bypasses to the real BFF.
const api = graphql.link('/api/graphql');

// Cache the email after the first successful fetch so repeated GetWorkspaces
// queries (from subscription refetches, StrictMode double-mounts, etc.) do not
// flood /api/auth/onboarding/me and trigger BFF rate-limiting.
let cachedUserEmail: string | null = null;

async function resolveUserEmail(): Promise<string> {
  if (cachedUserEmail !== null) return cachedUserEmail;
  try {
    const res = await fetch('/api/auth/onboarding/me');
    if (res.ok) {
      const body = (await res.json()) as { user?: { email?: string } };
      cachedUserEmail = body?.user?.email ?? 'mock@example.com';
    } else {
      cachedUserEmail = 'mock@example.com';
    }
  } catch {
    cachedUserEmail = 'mock@example.com';
  }
  return cachedUserEmail;
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
];
