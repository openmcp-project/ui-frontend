import { useCallback, useContext } from 'react';
import { useMcp } from '../lib/shared/McpContext';
import { fetchApiServerJson } from '../lib/api/fetch';
import { ApiConfigContext } from '../components/Shared/k8s';
import { useResourcePluralNames } from './useResourcePluralNames';

export interface CreateResourceResult {
  success: boolean;
  message?: string;
  error?: string;
  resource?: unknown;
}

/**
 * Hook to create a Kubernetes resource in a control plane via YAML
 */
export function useCreateResource() {
  const mcpContext = useMcp();
  const apiConfig = useContext(ApiConfigContext);
  const { getPluralKind } = useResourcePluralNames();

  const createResource = useCallback(
    async (yamlContent: string, namespace?: string): Promise<CreateResourceResult> => {
      try {
        // Parse YAML to extract kind and validate
        const parsed = await import('yaml').then((yaml) => yaml.parse(yamlContent));

        if (!parsed || typeof parsed !== 'object') {
          return {
            success: false,
            error: 'Invalid YAML: must be a valid Kubernetes resource object',
          };
        }

        const kind = parsed.kind;
        const apiVersion = parsed.apiVersion;
        const resourceName = parsed.metadata?.name;

        if (!kind || !apiVersion) {
          return {
            success: false,
            error: 'Invalid resource: kind and apiVersion are required',
          };
        }

        if (!resourceName) {
          return {
            success: false,
            error: 'Invalid resource: metadata.name is required',
          };
        }

        // Construct API path - get pluralKind with fallback
        let pluralKind = getPluralKind(kind);

        // Fallback: simple pluralization if mapping not available
        if (!pluralKind) {
          pluralKind = kind.toLowerCase() + 's';
        }

        // Determine the namespace to use (only for namespaced resources)
        const resourceNamespace = namespace || parsed.metadata?.namespace;
        const targetNamespace = resourceNamespace || mcpContext?.secretNamespace;

        // Ensure the namespace is set in the parsed object if specified
        if (resourceNamespace) {
          if (!parsed.metadata) {
            parsed.metadata = {};
          }
          parsed.metadata.namespace = resourceNamespace;
        }

        // Core resources (v1) use /api/v1, other resources use /apis/{group}/{version}
        const basePath = apiVersion === 'v1' ? '/api/v1' : `/apis/${apiVersion}`;

        // Build path - include namespace only if the resource specifies one
        const path = resourceNamespace
          ? `${basePath}/namespaces/${resourceNamespace}/${pluralKind}`
          : `${basePath}/${pluralKind}`;

        // POST the resource via the onboarding API
        const result = await fetchApiServerJson(
          path,
          apiConfig,
          undefined,
          'POST',
          JSON.stringify(parsed),
        );

        return {
          success: true,
          message: resourceNamespace
            ? `Successfully created ${kind} "${resourceName}" in namespace "${resourceNamespace}"`
            : `Successfully created ${kind} "${resourceName}"`,
          resource: result,
        };
      } catch (error) {
        console.error('Failed to create resource:', error);

        let errorMessage = 'Unknown error occurred';
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        } else if (error && typeof error === 'object' && 'message' in error) {
          errorMessage = (error as { message: string }).message;
        }

        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    [mcpContext, apiConfig, getPluralKind],
  );

  return { createResource };
}
