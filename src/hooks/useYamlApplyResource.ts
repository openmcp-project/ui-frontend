import type { ApolloClient } from '@apollo/client';
import { gql } from '@apollo/client';
import { parseDocument, parseAllDocuments, stringify } from 'yaml';
import { fetchApiServerJson } from '../lib/api/fetch';
import { APIError, isNotFoundError } from '../lib/api/error';
import type { ApiConfig } from '../lib/api/types/apiConfig';
import {
  CHARGING_TARGET_LABEL,
  CHARGING_TARGET_TYPE_LABEL,
  DISPLAY_NAME_ANNOTATION,
} from '../lib/api/types/shared/keyNames';
import type { Member } from '../lib/api/types/shared/members';
import type { CreateProjectParams } from '../spaces/onboarding/hooks/useCreateProject';
import type { CreateWorkspaceParams } from '../spaces/onboarding/hooks/useCreateWorkspace';
import { CreateProjectMutation } from '../spaces/onboarding/hooks/useCreateProject';
import { CreateWorkspaceMutation } from '../spaces/onboarding/hooks/useCreateWorkspace';
import { UpdateWorkspaceMutation } from '../spaces/onboarding/hooks/useUpdateWorkspace';
import { GetProjectQuery } from '../spaces/onboarding/hooks/useGetProject';
import { GetWorkspaceQuery } from '../spaces/onboarding/hooks/useGetWorkspace';
import { GET_MCP_V1_QUERY } from '../spaces/onboarding/hooks/useManagedControlPlaneQuery';
import { CreateManagedControlPlaneMutation } from './useCreateManagedControlPlane';
import { UpdateManagedControlPlaneMutation } from './useUpdateManagedControlPlane';
import { GET_MCP_V2_QUERY } from '../spaces/onboarding/hooks/controlPlaneV2/useControlPlaneV2Query';
import { CreateManagedControlPlaneV2Mutation } from '../spaces/controlPlaneV2/hooks/useCreateControlPlaneV2GraphQL';
import { UpdateManagedControlPlaneV2Mutation } from '../spaces/controlPlaneV2/hooks/useUpdateControlPlaneV2Mutation';
import type {
  CoreOpenControlPlaneIoV2alpha1ControlPlane_Input as ControlPlaneV2Input,
  CoreOpenmcpCloudV1alpha1ManagedControlPlane_Input as ManagedControlPlaneV1Input,
  CoreOpenmcpCloudV1alpha1Project_Input as ProjectInput,
  CoreOpenmcpCloudV1alpha1Workspace_Input as WorkspaceInput,
} from '../types/__generated__/graphql/graphql';

export type ParsedResource = {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace?: string;
    annotations?: Record<string, string>;
    labels?: Record<string, string>;
  };
  spec?: Record<string, unknown>;
  [key: string]: unknown;
};

export type ValidationError = 'wrong-file-type' | 'parse-error' | 'missing-fields' | 'empty-file';

/**
 * Kinds the Onboarding API applies through a dedicated, typed GraphQL mutation
 * (with existence checks, create/overwrite semantics, and — for ControlPlane — dry run).
 * Any other kind is applied generically via {@link applyOnboardingResource}'s `applyYaml` path.
 */
export const ONBOARDING_KINDS = ['Project', 'Workspace', 'ControlPlane', 'ManagedControlPlane'] as const;

export function isOnboardingKind(kind: string): boolean {
  return (ONBOARDING_KINDS as readonly string[]).includes(kind);
}

/** Stable identity of a resource within an apply queue (apiVersion + kind + namespace + name). */
export function resourceIdentity(r: ParsedResource): string {
  return `${r.apiVersion}|${r.kind}|${r.metadata.namespace ?? ''}|${r.metadata.name}`;
}

/** From `incoming`, keep only resources not already present in `existing` (by {@link resourceIdentity}). */
export function dedupeResources(existing: ParsedResource[], incoming: ParsedResource[]): ParsedResource[] {
  const seen = new Set(existing.map(resourceIdentity));
  return incoming.filter((r) => !seen.has(resourceIdentity(r)));
}

/**
 * New selected index after removing `removedIndex` from a queue of `lengthBefore` items.
 * Call only when `lengthBefore > 1` (removing the last item closes the dialog instead).
 */
export function nextIndexAfterRemove(removedIndex: number, currentIndex: number, lengthBefore: number): number {
  if (removedIndex < currentIndex) return currentIndex - 1;
  if (removedIndex === currentIndex) return Math.min(currentIndex, lengthBefore - 2);
  return currentIndex;
}

export type ValidationResult =
  { valid: true; resource: ParsedResource } | { valid: false; error: ValidationError; message: string };

function hasYamlExtension(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase();
  return ext === 'yaml' || ext === 'yml';
}

function resourceIsStructurallyValid(obj: unknown): obj is ParsedResource {
  const rec = obj as Record<string, unknown> | undefined;
  const meta = rec?.metadata as Record<string, unknown> | undefined;
  return !!rec?.apiVersion && !!rec?.kind && !!meta?.name;
}

export function validateYamlFile(fileName: string, content: string): ValidationResult {
  if (!hasYamlExtension(fileName)) {
    return { valid: false, error: 'wrong-file-type', message: fileName };
  }

  const doc = parseDocument(content);
  if (doc.errors.length > 0) {
    return { valid: false, error: 'parse-error', message: doc.errors[0].message };
  }

  const obj = doc.toJS() as Record<string, unknown>;
  if (!resourceIsStructurallyValid(obj)) {
    return { valid: false, error: 'missing-fields', message: '' };
  }

  return { valid: true, resource: obj as ParsedResource };
}

export type MultiDocResult =
  { valid: true; resources: ParsedResource[] } | { valid: false; error: ValidationError; message: string };

/**
 * Parses a (possibly multi-document) YAML file into a list of resources.
 * Empty documents (blank sections between `---`) are skipped. Fails on the first
 * document that cannot be parsed or that is missing required fields.
 */
export function parseYamlDocuments(fileName: string, content: string): MultiDocResult {
  if (!hasYamlExtension(fileName)) {
    return { valid: false, error: 'wrong-file-type', message: fileName };
  }

  const docs = parseAllDocuments(content);
  const resources: ParsedResource[] = [];

  for (const doc of docs) {
    if (doc.errors.length > 0) {
      return { valid: false, error: 'parse-error', message: doc.errors[0].message };
    }
    const obj = doc.toJS();
    // Skip empty documents (e.g. leading/trailing `---` or comment-only sections).
    if (obj == null || (typeof obj === 'object' && Object.keys(obj).length === 0)) {
      continue;
    }
    if (!resourceIsStructurallyValid(obj)) {
      return { valid: false, error: 'missing-fields', message: '' };
    }
    resources.push(obj as ParsedResource);
  }

  if (resources.length === 0) {
    return { valid: false, error: 'empty-file', message: '' };
  }

  return { valid: true, resources };
}

// ─── Control Plane (REST) ────────────────────────────────────────────────────

function buildCpPath(apiVersion: string, plural: string, namespace?: string, name?: string): string {
  const parts = apiVersion.split('/');
  const [group, version] = parts.length === 2 ? parts : ['', parts[0]];
  const base = group ? `/apis/${group}/${version}` : `/api/${version}`;
  const ns = namespace ? `/namespaces/${namespace}` : '';
  const n = name ? `/${name}` : '';
  return `${base}${ns}/${plural}${n}`;
}

export async function checkCpResourceExists(
  resource: ParsedResource,
  pluralKind: string,
  apiConfig: ApiConfig,
): Promise<boolean> {
  const path = buildCpPath(resource.apiVersion, pluralKind, resource.metadata.namespace, resource.metadata.name);
  try {
    await fetchApiServerJson(path, apiConfig);
    return true;
  } catch (e) {
    if (isNotFoundError(e as APIError)) return false;
    throw e;
  }
}

const SSA_FIELD_MANAGER = 'openmcp-ui';

/**
 * Applies a resource to a Control Plane using Kubernetes server-side apply
 * (`PATCH` with `application/apply-patch+yaml`). This is idempotent: it creates
 * the resource if absent and updates it otherwise, in a single call.
 *
 * With `dryRun`, the server validates and reports what it would do without
 * persisting anything (`?dryRun=All`).
 */
export async function applyCpResource(
  resource: ParsedResource,
  pluralKind: string,
  apiConfig: ApiConfig,
  dryRun = false,
): Promise<void> {
  const path = buildCpPath(resource.apiVersion, pluralKind, resource.metadata.namespace, resource.metadata.name);
  const query = `?fieldManager=${SSA_FIELD_MANAGER}&force=true${dryRun ? '&dryRun=All' : ''}`;
  const body = stringify(resource);
  await fetchApiServerJson(`${path}${query}`, apiConfig, undefined, 'PATCH', body, 'application/apply-patch+yaml');
}

// ─── Onboarding API (GraphQL) ────────────────────────────────────────────────

type OnboardingClient = ApolloClient;

function extractProjectParams(resource: ParsedResource): CreateProjectParams {
  const annotations = resource.metadata.annotations ?? {};
  const labels = resource.metadata.labels ?? {};
  const rawMembers = (resource.spec?.members ?? []) as Record<string, unknown>[];
  const members: Member[] = rawMembers.map((m) => ({
    kind: String(m.kind ?? 'User'),
    name: String(m.name ?? ''),
    roles: Array.isArray(m.roles) ? (m.roles as string[]) : [],
    namespace: m.namespace != null ? String(m.namespace) : undefined,
  }));
  return {
    name: resource.metadata.name,
    displayName: annotations[DISPLAY_NAME_ANNOTATION],
    chargingTarget: labels[CHARGING_TARGET_LABEL],
    chargingTargetType: labels[CHARGING_TARGET_TYPE_LABEL],
    members,
  };
}

function buildProjectInput(params: CreateProjectParams): ProjectInput {
  return {
    apiVersion: 'core.openmcp.cloud/v1alpha1',
    kind: 'Project',
    metadata: {
      name: params.name,
      annotations: { [DISPLAY_NAME_ANNOTATION]: params.displayName ?? '' },
      labels: {
        [CHARGING_TARGET_TYPE_LABEL]: params.chargingTargetType ?? '',
        [CHARGING_TARGET_LABEL]: params.chargingTarget ?? '',
      },
    },
    spec: {
      members: params.members.map((m) => ({
        kind: m.kind,
        name: m.name,
        namespace: m.kind === 'ServiceAccount' ? (m.namespace ?? 'default') : undefined,
        roles: m.roles,
      })),
    },
  };
}

function extractWorkspaceParams(resource: ParsedResource): { namespace: string; params: CreateWorkspaceParams } {
  const annotations = resource.metadata.annotations ?? {};
  const labels = resource.metadata.labels ?? {};
  const rawMembers = (resource.spec?.members ?? []) as Record<string, unknown>[];
  const members: Member[] = rawMembers.map((m) => ({
    kind: String(m.kind ?? 'User'),
    name: String(m.name ?? ''),
    roles: Array.isArray(m.roles) ? (m.roles as string[]) : [],
    namespace: m.namespace != null ? String(m.namespace) : undefined,
  }));
  return {
    namespace: resource.metadata.namespace ?? '',
    params: {
      name: resource.metadata.name,
      displayName: annotations[DISPLAY_NAME_ANNOTATION],
      chargingTarget: labels[CHARGING_TARGET_LABEL],
      chargingTargetType: labels[CHARGING_TARGET_TYPE_LABEL],
      members,
    },
  };
}

function buildWorkspaceInput(namespace: string, params: CreateWorkspaceParams): WorkspaceInput {
  return {
    apiVersion: 'core.openmcp.cloud/v1alpha1',
    kind: 'Workspace',
    metadata: {
      name: params.name,
      namespace,
      annotations: { [DISPLAY_NAME_ANNOTATION]: params.displayName ?? '' },
      labels: {
        [CHARGING_TARGET_TYPE_LABEL]: params.chargingTargetType ?? '',
        [CHARGING_TARGET_LABEL]: params.chargingTarget ?? '',
      },
    },
    spec: {
      members: params.members.map((m) => ({
        kind: m.kind,
        name: m.name,
        namespace: m.kind === 'ServiceAccount' ? (m.namespace ?? 'default') : undefined,
        roles: m.roles,
      })),
    },
  };
}

export async function checkOnboardingResourceExists(
  resource: ParsedResource,
  client: OnboardingClient,
): Promise<boolean> {
  const kind = resource.kind;
  try {
    if (kind === 'Project') {
      const { data } = await client.query({
        query: GetProjectQuery,
        variables: { name: resource.metadata.name },
        fetchPolicy: 'network-only',
      });
      return !!data?.core_openmcp_cloud?.v1alpha1?.Project;
    }
    if (kind === 'Workspace') {
      const { data } = await client.query({
        query: GetWorkspaceQuery,
        variables: { name: resource.metadata.name, namespace: resource.metadata.namespace ?? '' },
        fetchPolicy: 'network-only',
      });
      return !!data?.core_openmcp_cloud?.v1alpha1?.Workspace;
    }
    if (kind === 'ControlPlane') {
      const { data } = await client.query({
        query: GET_MCP_V2_QUERY,
        variables: { name: resource.metadata.name, namespace: resource.metadata.namespace ?? '' },
        fetchPolicy: 'network-only',
      });
      return !!data?.core_open_control_plane_io?.v2alpha1?.ControlPlane;
    }
    if (kind === 'ManagedControlPlane') {
      const { data } = await client.query({
        query: GET_MCP_V1_QUERY,
        variables: { name: resource.metadata.name, namespace: resource.metadata.namespace ?? '' },
        fetchPolicy: 'network-only',
      });
      return !!data?.core_openmcp_cloud?.v1alpha1?.ManagedControlPlane;
    }
  } catch {
    return false;
  }
  return false;
}

export type OnboardingApplyResult =
  { success: true } | { success: false; error: 'unsupported-kind' | 'api-error'; message?: string };

/**
 * Trims a parsed resource down to the fields the GraphQL create/update inputs accept,
 * dropping server-managed data (status, resourceVersion, uid, …) that would be rejected.
 */
function buildControlPlaneApplyInput(resource: ParsedResource) {
  return {
    apiVersion: resource.apiVersion,
    kind: resource.kind,
    metadata: {
      name: resource.metadata.name,
      namespace: resource.metadata.namespace,
      annotations: resource.metadata.annotations,
      labels: resource.metadata.labels,
    },
    spec: resource.spec,
  };
}

/** Kinds for which the Onboarding API exposes a server-side `dryRun`. Only the v2 ControlPlane does. */
export function supportsOnboardingDryRun(kind: string): boolean {
  return kind === 'ControlPlane';
}

/**
 * Generic server-side apply for kinds without a dedicated onboarding mutation.
 * Not a generated operation (not kind-specific), so authored with `gql`; the server
 * resolves the GVK from the manifest and returns the applied object as a JSON string.
 */
const APPLY_YAML_MUTATION = gql`
  mutation ApplyYaml($yaml: String!) {
    applyYaml(yaml: $yaml)
  }
`;

export async function applyOnboardingResource(
  resource: ParsedResource,
  exists: boolean,
  client: OnboardingClient,
  dryRun = false,
): Promise<OnboardingApplyResult> {
  const kind = resource.kind;

  if (dryRun && !supportsOnboardingDryRun(kind)) {
    throw new Error(`Dry run is not supported for ${kind} on the Onboarding API.`);
  }

  if (kind === 'Project') {
    // Projects are a special case: always CREATE, never update via this flow.
    const params = extractProjectParams(resource);
    const object = buildProjectInput(params);
    await client.mutate({
      mutation: CreateProjectMutation,
      variables: { object },
    });
    return { success: true };
  }

  if (kind === 'Workspace') {
    const { namespace, params } = extractWorkspaceParams(resource);
    const object = buildWorkspaceInput(namespace, params);
    if (exists) {
      await client.mutate({
        mutation: UpdateWorkspaceMutation,
        variables: { name: params.name, namespace, object },
        refetchQueries: ['GetWorkspaces', 'GetWorkspace'],
      });
    } else {
      await client.mutate({
        mutation: CreateWorkspaceMutation,
        variables: { namespace, object },
        refetchQueries: ['GetWorkspaces'],
      });
    }
    return { success: true };
  }

  if (kind === 'ControlPlane') {
    const namespace = resource.metadata.namespace ?? '';
    const object = buildControlPlaneApplyInput(resource) as unknown as ControlPlaneV2Input;
    // A dry run must not disturb caches, so skip refetchQueries in that mode.
    const refetchQueries = dryRun ? undefined : ['GetMCPsList'];
    if (exists) {
      await client.mutate({
        mutation: UpdateManagedControlPlaneV2Mutation,
        variables: { name: resource.metadata.name, namespace, object, dryRun },
        refetchQueries,
      });
    } else {
      await client.mutate({
        mutation: CreateManagedControlPlaneV2Mutation,
        variables: { namespace, object, dryRun },
        refetchQueries,
      });
    }
    return { success: true };
  }

  if (kind === 'ManagedControlPlane') {
    const namespace = resource.metadata.namespace ?? '';
    const object = buildControlPlaneApplyInput(resource) as unknown as ManagedControlPlaneV1Input;
    if (exists) {
      await client.mutate({
        mutation: UpdateManagedControlPlaneMutation,
        variables: { name: resource.metadata.name, namespace, object },
        refetchQueries: ['GetMCPsList'],
      });
    } else {
      await client.mutate({
        mutation: CreateManagedControlPlaneMutation,
        variables: { namespace, object },
        refetchQueries: ['GetMCPsList'],
      });
    }
    return { success: true };
  }

  // Any other kind: hand the raw manifest to the server's generic apply (server-side
  // apply = create-or-update). It resolves the GVK itself; no dry run is available here
  // (guarded above), and there is no per-kind existence check.
  await client.mutate({
    mutation: APPLY_YAML_MUTATION,
    variables: { yaml: stringify(resource) },
  });
  return { success: true };
}
