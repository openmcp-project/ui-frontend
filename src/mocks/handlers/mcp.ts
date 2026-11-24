import { graphql, HttpResponse } from 'msw';
import {
  createControlPlaneV2Result,
  createCrossplaneResult,
  createEsoResult,
  createFluxResult,
  createKroResult,
  createLandscaperResult,
  createMetricsOperatorResult,
  createOcmResult,
  crossplaneYaml,
  deleteCrossplaneResult,
  deleteControlPlaneV2Result,
  deleteEsoResult,
  deleteFluxResult,
  deleteKroResult,
  deleteLandscaperResult,
  deleteManagedControlPlaneResult,
  deleteMetricsOperatorResult,
  deleteOcmResult,
  esoYaml,
  fluxYaml,
  getManagedControlPlane,
  getManagedControlPlaneForEdit,
  kroYaml,
  kubeconfig,
  landscaperYaml,
  managedServices,
  metricsOperatorYaml,
  ocmYaml,
  updateControlPlaneV2Result,
  updateCrossplaneResult,
  updateEsoResult,
  updateFluxResult,
  updateKroResult,
  updateLandscaperResult,
  updateMetricsOperatorResult,
  updateOcmResult,
} from '../fixtures/mcp';

const api = graphql.link('/api/graphql');

export const mcpHandlers = [
  // ── V1 ManagedControlPlane ───────────────────────────────────────────────
  api.query('GetManagedControlPlane', ({ variables }) => {
    const { name, namespace } = variables as { name: string; namespace: string };
    return HttpResponse.json({ data: getManagedControlPlane(name, namespace) });
  }),

  api.query('GetManagedControlPlaneForEdit', ({ variables }) => {
    const { name, namespace } = variables as { name: string; namespace: string };
    return HttpResponse.json({ data: getManagedControlPlaneForEdit(name, namespace) });
  }),

  api.mutation('DeleteManagedControlPlane', () =>
    HttpResponse.json({ data: deleteManagedControlPlaneResult }),
  ),

  // ── V2 ControlPlane CRUD ─────────────────────────────────────────────────
  api.mutation('CreateManagedControlPlaneV2', ({ variables }) => {
    const { namespace, object } = variables as { namespace?: string; object: { metadata?: { name?: string } } };
    const name = object?.metadata?.name ?? 'new-cp';
    return HttpResponse.json({ data: createControlPlaneV2Result(name, namespace ?? '') });
  }),

  api.mutation('DeleteManagedControlPlaneV2', () =>
    HttpResponse.json({ data: deleteControlPlaneV2Result }),
  ),

  api.mutation('UpdateManagedControlPlaneV2', ({ variables }) => {
    const { name, namespace } = variables as { name: string; namespace?: string };
    return HttpResponse.json({ data: updateControlPlaneV2Result(name, namespace ?? '') });
  }),

  // ── Catalog & kubeconfig ─────────────────────────────────────────────────
  api.query('GetManagedServices', () => HttpResponse.json({ data: managedServices })),

  api.query('GetKubeconfig', () => HttpResponse.json({ data: kubeconfig })),

  // ── Service component create ─────────────────────────────────────────────
  api.mutation('CreateCrossplane', ({ variables }) => {
    const { namespace, object } = variables as { namespace?: string; object: { metadata?: { name?: string } } };
    return HttpResponse.json({ data: createCrossplaneResult(object?.metadata?.name ?? 'crossplane', namespace ?? '') });
  }),
  api.mutation('CreateFlux', ({ variables }) => {
    const { namespace, object } = variables as { namespace?: string; object: { metadata?: { name?: string } } };
    return HttpResponse.json({ data: createFluxResult(object?.metadata?.name ?? 'flux', namespace ?? '') });
  }),
  api.mutation('CreateLandscaper', ({ variables }) => {
    const { namespace, object } = variables as { namespace?: string; object: { metadata?: { name?: string } } };
    return HttpResponse.json({ data: createLandscaperResult(object?.metadata?.name ?? 'landscaper', namespace ?? '') });
  }),
  api.mutation('CreateExternalSecretsOperator', ({ variables }) => {
    const { namespace, object } = variables as { namespace?: string; object: { metadata?: { name?: string } } };
    return HttpResponse.json({ data: createEsoResult(object?.metadata?.name ?? 'eso', namespace ?? '') });
  }),
  api.mutation('CreateOCM', ({ variables }) => {
    const { namespace, object } = variables as { namespace?: string; object: { metadata?: { name?: string } } };
    return HttpResponse.json({ data: createOcmResult(object?.metadata?.name ?? 'ocm', namespace ?? '') });
  }),
  api.mutation('CreateKRO', ({ variables }) => {
    const { namespace, object } = variables as { namespace?: string; object: { metadata?: { name?: string } } };
    return HttpResponse.json({ data: createKroResult(object?.metadata?.name ?? 'kro', namespace ?? '') });
  }),
  api.mutation('CreateMetricsOperator', ({ variables }) => {
    const { namespace, object } = variables as { namespace?: string; object: { metadata?: { name?: string } } };
    return HttpResponse.json({ data: createMetricsOperatorResult(object?.metadata?.name ?? 'metrics-operator', namespace ?? '') });
  }),

  // ── Service component update ─────────────────────────────────────────────
  api.mutation('UpdateCrossplane', ({ variables }) => {
    const { name, namespace } = variables as { name: string; namespace?: string };
    return HttpResponse.json({ data: updateCrossplaneResult(name, namespace ?? '') });
  }),
  api.mutation('UpdateFlux', ({ variables }) => {
    const { name, namespace } = variables as { name: string; namespace?: string };
    return HttpResponse.json({ data: updateFluxResult(name, namespace ?? '') });
  }),
  api.mutation('UpdateLandscaper', ({ variables }) => {
    const { name, namespace } = variables as { name: string; namespace?: string };
    return HttpResponse.json({ data: updateLandscaperResult(name, namespace ?? '') });
  }),
  api.mutation('UpdateExternalSecretsOperator', ({ variables }) => {
    const { name, namespace } = variables as { name: string; namespace?: string };
    return HttpResponse.json({ data: updateEsoResult(name, namespace ?? '') });
  }),
  api.mutation('UpdateOCM', ({ variables }) => {
    const { name, namespace } = variables as { name: string; namespace?: string };
    return HttpResponse.json({ data: updateOcmResult(name, namespace ?? '') });
  }),
  api.mutation('UpdateKRO', ({ variables }) => {
    const { name, namespace } = variables as { name: string; namespace?: string };
    return HttpResponse.json({ data: updateKroResult(name, namespace ?? '') });
  }),
  api.mutation('UpdateMetricsOperator', ({ variables }) => {
    const { name, namespace } = variables as { name: string; namespace?: string };
    return HttpResponse.json({ data: updateMetricsOperatorResult(name, namespace ?? '') });
  }),

  // ── Service component delete ─────────────────────────────────────────────
  api.mutation('DeleteCrossplane', () => HttpResponse.json({ data: deleteCrossplaneResult })),
  api.mutation('DeleteFlux', () => HttpResponse.json({ data: deleteFluxResult })),
  api.mutation('DeleteLandscaper', () => HttpResponse.json({ data: deleteLandscaperResult })),
  api.mutation('DeleteExternalSecretsOperator', () => HttpResponse.json({ data: deleteEsoResult })),
  api.mutation('DeleteOCM', () => HttpResponse.json({ data: deleteOcmResult })),
  api.mutation('DeleteKRO', () => HttpResponse.json({ data: deleteKroResult })),
  api.mutation('DeleteMetricsOperator', () => HttpResponse.json({ data: deleteMetricsOperatorResult })),

  // ── Service component YAML ───────────────────────────────────────────────
  api.query('GetCrossplaneYaml', ({ variables }) => {
    const { name, namespace } = variables as { name: string; namespace?: string };
    return HttpResponse.json({ data: crossplaneYaml(name, namespace ?? '') });
  }),
  api.query('GetFluxYaml', ({ variables }) => {
    const { name, namespace } = variables as { name: string; namespace?: string };
    return HttpResponse.json({ data: fluxYaml(name, namespace ?? '') });
  }),
  api.query('GetLandscaperYaml', ({ variables }) => {
    const { name, namespace } = variables as { name: string; namespace?: string };
    return HttpResponse.json({ data: landscaperYaml(name, namespace ?? '') });
  }),
  api.query('GetEsoYaml', ({ variables }) => {
    const { name, namespace } = variables as { name: string; namespace?: string };
    return HttpResponse.json({ data: esoYaml(name, namespace ?? '') });
  }),
  api.query('GetOcmYaml', ({ variables }) => {
    const { name, namespace } = variables as { name: string; namespace?: string };
    return HttpResponse.json({ data: ocmYaml(name, namespace ?? '') });
  }),
  api.query('GetKroYaml', ({ variables }) => {
    const { name, namespace } = variables as { name: string; namespace?: string };
    return HttpResponse.json({ data: kroYaml(name, namespace ?? '') });
  }),
  api.query('GetMetricsOperatorYaml', ({ variables }) => {
    const { name, namespace } = variables as { name: string; namespace?: string };
    return HttpResponse.json({ data: metricsOperatorYaml(name, namespace ?? '') });
  }),
];
