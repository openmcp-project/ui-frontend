import { useMemo } from 'react';
import { useApiResource } from '../lib/api/useApiResource.ts';
import { CustomResourceDefinition } from '../types/customResourceDefinition.ts';
import { getCustomResourceDefinitionPluralName } from '../utils/getPluralName.ts';
import openapiSchemaToJsonSchema from '@openapi-contrib/openapi-schema-to-json-schema';
import { APIError } from '../lib/api/error.ts';

export interface UseCustomResourceDefinitionQueryParams {
  kind?: string;
  apiGroupName: string;
  apiVersion: string;
}

export interface UseCustomResourceDefinitionQueryResult {
  schema: ReturnType<typeof openapiSchemaToJsonSchema> | undefined;
  crdData: CustomResourceDefinition | undefined;
  isLoading: boolean;
  error: APIError | undefined;
}

export function useCustomResourceDefinitionQuery({
  kind,
  apiGroupName,
  apiVersion,
}: UseCustomResourceDefinitionQueryParams): UseCustomResourceDefinitionQueryResult {
  const customResourceDefinitionName = getCustomResourceDefinitionPluralName(kind);

  const {
    data: crdData,
    isLoading,
    error,
  } = useApiResource<CustomResourceDefinition>(
    {
      path: `/apis/apiextensions.k8s.io/v1/customresourcedefinitions/${customResourceDefinitionName}.${apiGroupName}`,
    },
    undefined,
    undefined,
    !customResourceDefinitionName,
  );

  const openAPISchema = useMemo(() => {
    if (!crdData) {
      return undefined;
    }

    // Find the schema for the specified API version, or fall back to the first version
    return (
      crdData.spec.versions?.find(({ name }) => name === apiVersion)?.schema.openAPIV3Schema ??
      crdData.spec.versions?.[0]?.schema.openAPIV3Schema
    );
  }, [crdData, apiVersion]);

  const schema = useMemo(() => (openAPISchema ? openapiSchemaToJsonSchema(openAPISchema) : undefined), [openAPISchema]);

  return {
    schema,
    crdData,
    isLoading,
    error,
  };
}
