import { graphql, HttpResponse } from 'msw';
import {
  createCrossplaneResult,
  createEsoResult,
  createFluxResult,
  createKroResult,
  createLandscaperResult,
  createMetricsOperatorResult,
  createOcmResult,
  crossplaneYaml,
  deleteCrossplaneResult,
  deleteEsoResult,
  deleteFluxResult,
  deleteKroResult,
  deleteLandscaperResult,
  deleteMetricsOperatorResult,
  deleteOcmResult,
  esoYaml,
  fluxYaml,
  getManagedControlPlane,
  kroYaml,
  landscaperYaml,
  managedServices,
  metricsOperatorYaml,
  ocmYaml,
  updateCrossplaneResult,
  updateEsoResult,
  updateFluxResult,
  updateKroResult,
  updateLandscaperResult,
  updateMetricsOperatorResult,
  updateOcmResult,
} from '../fixtures/mcp';

const api = graphql.link('/api/graphql');

type CreateVars = { namespace?: string; object: { metadata?: { name?: string } } };
type UpdateVars = { name: string; namespace?: string };

function makeComponentHandlers(
  suffix: string,
  defaultName: string,
  fns: {
    create: (name: string, ns: string) => unknown;
    update: (name: string, ns: string) => unknown;
    deleteResult: unknown;
    yaml: (name: string, ns: string) => unknown;
  },
  yamlSuffix = suffix,
) {
  return [
    api.mutation(`Create${suffix}`, ({ variables }) => {
      const { namespace, object } = variables as CreateVars;
      return HttpResponse.json({
        data: fns.create(object?.metadata?.name ?? defaultName, namespace ?? '') as Record<string, unknown>,
      });
    }),
    api.mutation(`Update${suffix}`, ({ variables }) => {
      const { name, namespace } = variables as UpdateVars;
      return HttpResponse.json({ data: fns.update(name, namespace ?? '') as Record<string, unknown> });
    }),
    api.mutation(`Delete${suffix}`, () => HttpResponse.json({ data: fns.deleteResult as Record<string, unknown> })),
    api.query(`Get${yamlSuffix}Yaml`, ({ variables }) => {
      const { name, namespace } = variables as UpdateVars;
      return HttpResponse.json({ data: fns.yaml(name, namespace ?? '') as Record<string, unknown> });
    }),
  ];
}

export const mcpHandlers = [
  // ── V1 ManagedControlPlane ───────────────────────────────────────────────
  api.query('GetManagedControlPlane', ({ variables }) => {
    const { name, namespace } = variables as { name: string; namespace: string };
    return HttpResponse.json({ data: getManagedControlPlane(name, namespace) });
  }),

  // ── Catalog ──────────────────────────────────────────────────────────────
  api.query('GetManagedServices', () => HttpResponse.json({ data: managedServices })),

  // ── Service components ───────────────────────────────────────────────────
  ...makeComponentHandlers('Crossplane', 'crossplane', {
    create: createCrossplaneResult,
    update: updateCrossplaneResult,
    deleteResult: deleteCrossplaneResult,
    yaml: crossplaneYaml,
  }),
  ...makeComponentHandlers('Flux', 'flux', {
    create: createFluxResult,
    update: updateFluxResult,
    deleteResult: deleteFluxResult,
    yaml: fluxYaml,
  }),
  ...makeComponentHandlers('Landscaper', 'landscaper', {
    create: createLandscaperResult,
    update: updateLandscaperResult,
    deleteResult: deleteLandscaperResult,
    yaml: landscaperYaml,
  }),
  ...makeComponentHandlers(
    'ExternalSecretsOperator',
    'eso',
    {
      create: createEsoResult,
      update: updateEsoResult,
      deleteResult: deleteEsoResult,
      yaml: esoYaml,
    },
    'Eso',
  ),
  ...makeComponentHandlers(
    'OCM',
    'ocm',
    {
      create: createOcmResult,
      update: updateOcmResult,
      deleteResult: deleteOcmResult,
      yaml: ocmYaml,
    },
    'Ocm',
  ),
  ...makeComponentHandlers(
    'KRO',
    'kro',
    {
      create: createKroResult,
      update: updateKroResult,
      deleteResult: deleteKroResult,
      yaml: kroYaml,
    },
    'Kro',
  ),
  ...makeComponentHandlers('MetricsOperator', 'metrics-operator', {
    create: createMetricsOperatorResult,
    update: updateMetricsOperatorResult,
    deleteResult: deleteMetricsOperatorResult,
    yaml: metricsOperatorYaml,
  }),
];
