import { graphql, HttpResponse } from 'msw';
import {
  controlPlaneYaml,
  createControlPlaneV2Result,
  deleteManagedControlPlaneResult,
  deleteControlPlaneV2Result,
  getManagedControlPlaneForEdit,
  kubeconfigData,
  mcpYaml,
  updateControlPlaneV2Result,
} from '../fixtures/controlPlanes';
import { createProjectResult } from '../fixtures/projects';

const api = graphql.link('/api/graphql');

export const managedControlPlaneHandlers = [
  // ── V1 MCP ───────────────────────────────────────────────────────────────
  api.query('GetManagedControlPlaneForEdit', ({ variables }) => {
    const { name, namespace } = variables as { name: string; namespace: string };
    return HttpResponse.json({ data: getManagedControlPlaneForEdit(name, namespace) });
  }),

  api.query('McpYaml', ({ variables }) => {
    const { name, namespace } = variables as { name: string; namespace?: string };
    return HttpResponse.json({ data: mcpYaml(name, namespace ?? '') });
  }),

  api.mutation('DeleteManagedControlPlane', () =>
    HttpResponse.json({ data: deleteManagedControlPlaneResult }),
  ),

  // ── V2 ControlPlane ──────────────────────────────────────────────────────
  api.query('ControlPlaneYaml', ({ variables }) => {
    const { name, namespace } = variables as { name: string; namespace?: string };
    return HttpResponse.json({ data: controlPlaneYaml(name, namespace ?? '') });
  }),

  api.mutation('CreateManagedControlPlaneV2', ({ variables }) => {
    const { namespace, object } = variables as {
      namespace?: string;
      object: { metadata?: { name?: string } };
    };
    const name = object?.metadata?.name ?? 'new-cp';
    return HttpResponse.json({ data: createControlPlaneV2Result(name, namespace ?? '') });
  }),

  api.mutation('UpdateManagedControlPlaneV2', ({ variables }) => {
    const { name, namespace } = variables as { name: string; namespace?: string };
    return HttpResponse.json({ data: updateControlPlaneV2Result(name, namespace ?? '') });
  }),

  api.mutation('DeleteManagedControlPlaneV2', () =>
    HttpResponse.json({ data: deleteControlPlaneV2Result }),
  ),

  // ── Project creation ─────────────────────────────────────────────────────
  api.mutation('CreateProject', ({ variables }) => {
    const { object } = variables as { object: { metadata?: { name?: string } } };
    const name = object?.metadata?.name ?? 'new-project';
    return HttpResponse.json({ data: createProjectResult(name) });
  }),

  // ── Kubeconfig ───────────────────────────────────────────────────────────
  api.query('GetKubeconfig', () => HttpResponse.json({ data: kubeconfigData })),
];
