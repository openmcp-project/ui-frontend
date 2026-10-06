import { ApolloClient, gql } from '@apollo/client';
import { parseDocument, parseAllDocuments } from 'yaml';
import { ApiConfig } from '../lib/api/types/apiConfig';
import { fetchApiServerJson } from '../lib/api/fetch';
import { isNotFoundError, APIError } from '../lib/api/error';
import {
  DISPLAY_NAME_ANNOTATION,
  CHARGING_TARGET_LABEL,
  CHARGING_TARGET_TYPE_LABEL,
} from '../lib/api/types/shared/keyNames';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ParsedResource {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace?: string;
    annotations?: Record<string, string>;
    labels?: Record<string, string>;
  };
  spec?: unknown;
}

export type ValidationErrorKind = 'wrong-file-type' | 'parse-error' | 'missing-fields' | 'empty-file';

export interface ValidationResult {
  valid: true;
  resource: ParsedResource;
}

export interface ValidationError {
  valid: false;
  error: ValidationErrorKind;
  message: string;
}

export type SingleDocResult = ValidationResult | ValidationError;

export interface MultiDocResult {
  valid: true;
  resources: ParsedResource[];
}

export type MultiDocParseResult = MultiDocResult | ValidationError;

export interface OnboardingApplyResult {
  success: true;
}

export type OnboardingClient = ApolloClient;

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

const ALLOWED_EXTENSIONS = ['.yaml', '.yml'];

function checkExtension(fileName: string): boolean {
  return ALLOWED_EXTENSIONS.some((ext) => fileName.toLowerCase().endsWith(ext));
}

function validateResource(doc: { toJS(): unknown }): ParsedResource | string {
  const js = doc.toJS() as Record<string, unknown>;
  if (!js || typeof js !== 'object') return 'Document is empty or not an object';

  const missing: string[] = [];
  if (!js.apiVersion) missing.push('apiVersion');
  if (!js.kind) missing.push('kind');
  if (!(js as { metadata?: { name?: unknown } }).metadata?.name) missing.push('metadata.name');
  if (missing.length > 0) return `Missing required field${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`;

  return js as unknown as ParsedResource;
}

export function validateYamlFile(fileName: string, content: string): SingleDocResult {
  if (!checkExtension(fileName)) {
    return { valid: false, error: 'wrong-file-type', message: 'Only .yaml and .yml files are accepted.' };
  }

  let doc: ReturnType<typeof parseDocument>;
  try {
    doc = parseDocument(content);
  } catch (e) {
    return {
      valid: false,
      error: 'parse-error',
      message: e instanceof Error ? e.message : String(e),
    };
  }

  if (doc.errors && doc.errors.length > 0) {
    return { valid: false, error: 'parse-error', message: doc.errors[0].message };
  }

  const result = validateResource(doc);
  if (typeof result === 'string') {
    return { valid: false, error: 'missing-fields', message: result };
  }

  return { valid: true, resource: result };
}

export function parseYamlDocuments(fileName: string, content: string): MultiDocParseResult {
  if (!checkExtension(fileName)) {
    return { valid: false, error: 'wrong-file-type', message: 'Only .yaml and .yml files are accepted.' };
  }

  let docs: ReturnType<typeof parseAllDocuments>;
  try {
    docs = parseAllDocuments(content);
  } catch (e) {
    return {
      valid: false,
      error: 'parse-error',
      message: e instanceof Error ? e.message : String(e),
    };
  }

  const nonEmpty = docs.filter((d) => d.contents !== null && d.toJS() !== null);

  if (nonEmpty.length === 0) {
    return { valid: false, error: 'empty-file', message: 'The file contains no YAML documents.' };
  }

  const resources: ParsedResource[] = [];
  for (const doc of nonEmpty) {
    if (doc.errors && doc.errors.length > 0) {
      return { valid: false, error: 'parse-error', message: `${fileName}: ${doc.errors[0].message}` };
    }
    const result = validateResource(doc);
    if (typeof result === 'string') {
      return { valid: false, error: 'missing-fields', message: result };
    }
    resources.push(result);
  }

  return { valid: true, resources };
}

// ---------------------------------------------------------------------------
// CP path helpers
// ---------------------------------------------------------------------------

export function buildCpPath(apiVersion: string, plural: string, namespace?: string, name?: string): string {
  const hasGroup = apiVersion.includes('/');
  const [group, version] = hasGroup ? apiVersion.split('/') : ['', apiVersion];

  const base = hasGroup ? `/apis/${group}/${version}` : `/api/${version}`;
  const nsSegment = namespace ? `/namespaces/${namespace}` : '';
  const nameSegment = name ? `/${name}` : '';

  return `${base}${nsSegment}/${plural}${nameSegment}`;
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
    if (isNotFoundError(e instanceof APIError ? e : undefined)) return false;
    throw e;
  }
}

const SSA_QUERY = '?fieldManager=openmcp-ui&force=true';

export async function dryRunCpResource(
  resource: ParsedResource,
  yamlContent: string,
  pluralKind: string,
  apiConfig: ApiConfig,
): Promise<void> {
  const path =
    buildCpPath(resource.apiVersion, pluralKind, resource.metadata.namespace, resource.metadata.name) +
    SSA_QUERY +
    '&dryRun=All';
  await fetchApiServerJson(path, apiConfig, undefined, 'PATCH', yamlContent, 'application/apply-patch+yaml');
}

export async function applyCpResource(
  resource: ParsedResource,
  yamlContent: string,
  pluralKind: string,
  apiConfig: ApiConfig,
): Promise<void> {
  const path =
    buildCpPath(resource.apiVersion, pluralKind, resource.metadata.namespace, resource.metadata.name) + SSA_QUERY;
  await fetchApiServerJson(path, apiConfig, undefined, 'PATCH', yamlContent, 'application/apply-patch+yaml');
}

// ---------------------------------------------------------------------------
// Onboarding path helpers
// ---------------------------------------------------------------------------

const CheckProjectExistsQuery = gql`
  query CheckProjectExists($name: String!) {
    core_openmcp_cloud {
      v1alpha1 {
        Project(name: $name) {
          metadata {
            name
          }
        }
      }
    }
  }
`;

const CheckWorkspaceExistsQuery = gql`
  query CheckWorkspaceExists($name: String!, $namespace: String!) {
    core_openmcp_cloud {
      v1alpha1 {
        Workspace(name: $name, namespace: $namespace) {
          metadata {
            name
          }
        }
      }
    }
  }
`;

const CreateProjectMutation = gql`
  mutation ApplyCreateProject($object: CoreOpenmcpCloudV1alpha1Project_Input!, $dryRun: Boolean) {
    core_openmcp_cloud {
      v1alpha1 {
        createProject(object: $object, dryRun: $dryRun) {
          metadata {
            name
          }
        }
      }
    }
  }
`;

const CreateWorkspaceMutation = gql`
  mutation ApplyCreateWorkspace(
    $namespace: String!
    $object: CoreOpenmcpCloudV1alpha1Workspace_Input!
    $dryRun: Boolean
  ) {
    core_openmcp_cloud {
      v1alpha1 {
        createWorkspace(namespace: $namespace, object: $object, dryRun: $dryRun) {
          metadata {
            name
          }
        }
      }
    }
  }
`;

const UpdateWorkspaceMutation = gql`
  mutation ApplyUpdateWorkspace(
    $name: String!
    $namespace: String!
    $object: CoreOpenmcpCloudV1alpha1Workspace_Input!
    $dryRun: Boolean
  ) {
    core_openmcp_cloud {
      v1alpha1 {
        updateWorkspace(name: $name, namespace: $namespace, object: $object, dryRun: $dryRun) {
          metadata {
            name
          }
        }
      }
    }
  }
`;

export async function checkOnboardingResourceExists(
  resource: ParsedResource,
  client: OnboardingClient,
): Promise<boolean> {
  if (resource.kind === 'Project') {
    const res = await client.query({
      query: CheckProjectExistsQuery,
      variables: { name: resource.metadata.name },
      fetchPolicy: 'network-only',
    });
    const data = res.data as { core_openmcp_cloud?: { v1alpha1?: { Project?: { metadata?: { name?: string } } } } };
    return !!data?.core_openmcp_cloud?.v1alpha1?.Project?.metadata?.name;
  }

  if (resource.kind === 'Workspace') {
    const res = await client.query({
      query: CheckWorkspaceExistsQuery,
      variables: { name: resource.metadata.name, namespace: resource.metadata.namespace ?? '' },
      fetchPolicy: 'network-only',
    });
    const data = res.data as { core_openmcp_cloud?: { v1alpha1?: { Workspace?: { metadata?: { name?: string } } } } };
    return !!data?.core_openmcp_cloud?.v1alpha1?.Workspace?.metadata?.name;
  }

  return false;
}

function buildProjectInput(resource: ParsedResource) {
  const annotations = resource.metadata.annotations ?? {};
  const labels = resource.metadata.labels ?? {};
  const spec = (resource.spec ?? {}) as {
    members?: { kind?: string; name?: string; namespace?: string; roles?: string[] }[];
  };

  return {
    apiVersion: 'core.openmcp.cloud/v1alpha1',
    kind: 'Project',
    metadata: {
      name: resource.metadata.name,
      annotations: {
        [DISPLAY_NAME_ANNOTATION]: annotations[DISPLAY_NAME_ANNOTATION] ?? '',
      },
      labels: {
        [CHARGING_TARGET_TYPE_LABEL]: labels[CHARGING_TARGET_TYPE_LABEL] ?? '',
        [CHARGING_TARGET_LABEL]: labels[CHARGING_TARGET_LABEL] ?? '',
      },
    },
    spec: {
      members: (spec.members ?? []).map((m) => ({
        kind: m.kind ?? 'User',
        name: m.name ?? '',
        namespace: m.namespace,
        roles: m.roles ?? [],
      })),
    },
  };
}

function buildWorkspaceInput(resource: ParsedResource) {
  const annotations = resource.metadata.annotations ?? {};
  const labels = resource.metadata.labels ?? {};
  const namespace = resource.metadata.namespace ?? '';
  const spec = (resource.spec ?? {}) as {
    members?: { kind?: string; name?: string; namespace?: string; roles?: string[] }[];
  };

  return {
    apiVersion: 'core.openmcp.cloud/v1alpha1',
    kind: 'Workspace',
    metadata: {
      name: resource.metadata.name,
      namespace,
      annotations: {
        [DISPLAY_NAME_ANNOTATION]: annotations[DISPLAY_NAME_ANNOTATION] ?? '',
      },
      labels: {
        [CHARGING_TARGET_TYPE_LABEL]: labels[CHARGING_TARGET_TYPE_LABEL] ?? '',
        [CHARGING_TARGET_LABEL]: labels[CHARGING_TARGET_LABEL] ?? '',
      },
    },
    spec: {
      members: (spec.members ?? []).map((m) => ({
        kind: m.kind ?? 'User',
        name: m.name ?? '',
        namespace: m.namespace,
        roles: m.roles ?? [],
      })),
    },
  };
}

export async function applyOnboardingResource(
  resource: ParsedResource,
  exists: boolean,
  client: OnboardingClient,
  dryRun?: boolean,
): Promise<OnboardingApplyResult> {
  if (resource.kind === 'Project') {
    const object = buildProjectInput(resource);
    await client.mutate({
      mutation: CreateProjectMutation,
      variables: { object, dryRun: dryRun ?? null },
    });
    return { success: true };
  }

  if (resource.kind === 'Workspace') {
    const namespace = resource.metadata.namespace ?? '';
    const object = buildWorkspaceInput(resource);

    if (exists) {
      await client.mutate({
        mutation: UpdateWorkspaceMutation,
        variables: { name: resource.metadata.name, namespace, object, dryRun: dryRun ?? null },
        refetchQueries: dryRun ? [] : ['GetWorkspaces', 'GetWorkspace'],
      });
    } else {
      await client.mutate({
        mutation: CreateWorkspaceMutation,
        variables: { namespace, object, dryRun: dryRun ?? null },
        refetchQueries: dryRun ? [] : ['GetWorkspaces'],
      });
    }
    return { success: true };
  }

  throw new Error(`Unsupported kind for Onboarding API: ${resource.kind}`);
}
