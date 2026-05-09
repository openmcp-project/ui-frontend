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

  console.log('[useCreateResource] apiConfig:', apiConfig);
  console.log('[useCreateResource] mcpContext:', mcpContext);

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
          console.warn(`[useCreateResource] No CRD mapping for kind "${kind}", using fallback: ${pluralKind}`);
        }

        // Determine the namespace to use
        const targetNamespace = namespace || parsed.metadata?.namespace || mcpContext?.name;

        if (!targetNamespace) {
          return {
            success: false,
            error: 'No namespace specified. Please add metadata.namespace to your resource.',
          };
        }

        // Ensure the namespace is set in the parsed object
        if (!parsed.metadata) {
          parsed.metadata = {};
        }
        parsed.metadata.namespace = targetNamespace;

        const basePath = `/apis/${apiVersion}`;
        const path = `${basePath}/namespaces/${targetNamespace}/${pluralKind}`;

        console.log('[useCreateResource] Creating resource:', {
          kind,
          pluralKind,
          apiVersion,
          targetNamespace,
          resourceName,
          path,
        });

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
          message: `Successfully created ${kind} "${resourceName}" in namespace "${targetNamespace}"`,
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
