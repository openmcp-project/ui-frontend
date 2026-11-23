import { graphql, HttpResponse } from 'msw';
import { mcpV2Detail } from '../fixtures/controlPlanes';
import { crossplane, eso, flux, kro, landscaper, mcpV2Components, metricsOperator, ocm } from '../fixtures/components';

const api = graphql.link('/api/graphql');

export const controlPlaneV2Handlers = [
  api.query('GetMCPv2', () => HttpResponse.json({ data: mcpV2Detail })),
  api.query('GetMcpV2ComponentsList', () => HttpResponse.json({ data: mcpV2Components })),
  api.query('GetCrossplane', () => HttpResponse.json({ data: crossplane })),
  api.query('GetFlux', () => HttpResponse.json({ data: flux })),
  api.query('GetExternalSecretsOperator', () => HttpResponse.json({ data: eso })),
  api.query('GetLandscaper', () => HttpResponse.json({ data: landscaper })),
  api.query('GetOCM', () => HttpResponse.json({ data: ocm })),
  api.query('GetKRO', () => HttpResponse.json({ data: kro })),
  api.query('GetMetricsOperator', () => HttpResponse.json({ data: metricsOperator })),
];
