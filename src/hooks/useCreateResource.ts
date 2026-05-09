import { useCallback } from 'react';
import { useMcpContext } from '../lib/shared/McpContext';
import { useApiResource } from '../lib/api/useApiResource';
import { Resource } from '../lib/api/types/resource';

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
  const mcpContext = useMcpContext();

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

        // Determine the namespace to use
        const targetNamespace = namespace || parsed.metadata?.namespace || mcpContext?.name;

        if (!targetNamespace) {
          return {
            success: false,
            error: 'No namespace specified. Please add metadata.namespace to your resource.',
          };
        }

        // Construct API path for generic resource creation
        // Format: /api/v1/namespaces/{namespace}/{resourceType}
        // or /apis/{group}/{version}/namespaces/{namespace}/{resourceType}
        const [group, version] = apiVersion.includes('/')
          ? apiVersion.split('/')
          : ['', apiVersion];

        const resourceType = kind.toLowerCase() + 's'; // Simple pluralization
        const apiPrefix = group ? `/apis/${group}/${version}` : `/api/${version}`;
        const path = `${apiPrefix}/namespaces/${targetNamespace}/${resourceType}`;

        // Use the API resource system to POST
        const resource: Resource<unknown> = {
          path,
          method: 'POST',
          body: yamlContent,
        };

        const { mutate } = useApiResource(resource);
        const result = await mutate();

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
    [mcpContext],
  );

  return { createResource };
}
