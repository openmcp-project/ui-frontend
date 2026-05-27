import { useCallback, useContext } from 'react';
import { useMcp } from '../lib/shared/McpContext';
import { fetchApiServerJson } from '../lib/api/fetch';
import { ApiConfigContext } from '../components/Shared/k8s';
import { useResourcePluralNames } from './useResourcePluralNames';
import { APIError } from '../lib/api/error';

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

        // Determine the namespace to use
        const explicitNamespace = namespace || parsed.metadata?.namespace;
        const useNamespace = explicitNamespace || mcpContext?.secretNamespace;

        // Inject namespace into payload if we determined one
        if (useNamespace) {
          if (!parsed.metadata) {
            parsed.metadata = {};
          }
          parsed.metadata.namespace = useNamespace;
        }

        // Core resources (v1) use /api/v1, other resources use /apis/{group}/{version}
        const basePath = apiVersion === 'v1' ? '/api/v1' : `/apis/${apiVersion}`;

        // Build path with namespace if we have one
        const path = useNamespace
          ? `${basePath}/namespaces/${useNamespace}/${pluralKind}`
          : `${basePath}/${pluralKind}`;

        // POST the resource via the onboarding API
        const result = await fetchApiServerJson(path, apiConfig, undefined, 'POST', JSON.stringify(parsed));

        return {
          success: true,
          message: useNamespace
            ? `Successfully created ${kind} "${resourceName}" in namespace "${useNamespace}"`
            : `Successfully created ${kind} "${resourceName}"`,
          resource: result,
        };
      } catch (error) {
        console.error('Failed to create resource:', error);

        let errorMessage = 'Unknown error occurred';

        if (error instanceof APIError) {
          // Check if we have detailed Kubernetes error info
          if (error.info && typeof error.info === 'object') {
            const k8sError = error.info as { message?: string; code?: number; reason?: string; details?: unknown };
            if (k8sError.message) {
              errorMessage = k8sError.message;

              // Add additional context if available
              if (k8sError.reason) {
                errorMessage += ` (${k8sError.reason})`;
              }
              if (k8sError.details && typeof k8sError.details === 'object') {
                const details = [];
                const detailsObj = k8sError.details as Record<string, unknown>;
                if (detailsObj.name) details.push(`name: ${detailsObj.name}`);
                if (detailsObj.kind) details.push(`kind: ${detailsObj.kind}`);
                if (details.length > 0) {
                  errorMessage += ` - ${details.join(', ')}`;
                }
              }
            } else {
              errorMessage = error.message;
            }
          } else {
            errorMessage = error.message;
          }
        } else if (error instanceof Error) {
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
