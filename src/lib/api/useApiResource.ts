import { useContext, useEffect, useState } from 'react';
import useSWR, { SWRConfiguration, useSWRConfig } from 'swr';
import { fetchApiServerJson } from './fetch';
import { ApiConfigContext } from '../../components/Shared/k8s';
import { APIError } from './error';
import { ApiConfig } from './types/apiConfig';
import { Resource } from './types/resource';
import useSWRMutation, { SWRMutationConfiguration } from 'swr/mutation';
import { MutatorOptions } from 'swr/_internal';
import { CRDRequest, CRDResponse } from './types/crossplane/CRDList';
import { ProviderConfigs, ProviderConfigsData, ProviderConfigsDataForRequest } from '../shared/types';

export const useApiResource = <T>(resource: Resource<T>, config?: SWRConfiguration, excludeMcpConfig?: boolean) => {
  const apiConfig = useContext(ApiConfigContext);

  const { data, error, isLoading, isValidating } = useSWR(
    resource.path === null
      ? null //TODO: is null a valid key?
      : [resource.path, apiConfig],
    ([path, apiConfig]) =>
      fetchApiServerJson<T>(
        path,
        excludeMcpConfig ? { ...apiConfig, mcpConfig: undefined } : apiConfig,
        resource.jq,
        resource.method,
        resource.body,
      ),
    config,
  );

  return {
    data,
    error: error as APIError,
    isLoading: isLoading,
    isValidating: isValidating,
  };
};

export const useProvidersConfigResource = (config?: SWRConfiguration) => {
  const apiConfig = useContext(ApiConfigContext);
  const { data, error, isValidating } = useSWR(
    CRDRequest.path === null
      ? null //TODO: is null a valid key?
      : [CRDRequest.path, apiConfig],
    ([path, apiConfig]) =>
      fetchApiServerJson<CRDResponse>(path, apiConfig, CRDRequest.jq, CRDRequest.method, CRDRequest.body),
    config,
  );

  const providerConfigsDataForRequest: ProviderConfigsDataForRequest[] = [];

  const crdWithProviderConfig = data?.items.filter((x) => x.spec.names.kind === 'ProviderConfig');

  const providerConfigsData: ProviderConfigsData[] =
    crdWithProviderConfig?.map((item) => {
      const providerName = item.metadata.ownerReferences.find((x) => x.kind === 'Provider')?.name;

      return {
        provider: providerName ? providerName : '',
        name: item.spec.group,
        versions: item.spec.versions,
      };
    }) ?? [];

  if (providerConfigsData.length > 0) {
    providerConfigsData.forEach((item) => {
      item.versions.forEach((version) => {
        providerConfigsDataForRequest.push({
          provider: item.provider,
          url: item.name,
          version: version.name,
        });
      });
    });
  }

  const fetchProviderConfigsData = async () => {
    const promises = providerConfigsDataForRequest.map(async (item) => {
      const data = await fetchApiServerJson<ProviderConfigs>(
        `/apis/${item.url ?? ''}/${item.version}/providerconfigs`,
        apiConfig,
        CRDRequest.jq,
        CRDRequest.method,
        CRDRequest.body,
      );
      if (data) {
        providerConfigs.push(data);
      }
    });

    await Promise.all(promises);
  };

  const providerConfigs: ProviderConfigs[] = [];

  const fetchProviderConfigs = async () => {
    try {
      // Create an array of promises for each fetch call
      const fetchPromises = providerConfigsDataForRequest.map(async (item) => {
        const data = await fetchApiServerJson<ProviderConfigs>(
          `/apis/${item.url ?? ''}/${item.version}/providerconfigs`,
          apiConfig,
          CRDRequest.jq,
          CRDRequest.method,
          CRDRequest.body,
        );
        data.provider = item.provider;
        return data; // Return fetched data
      });

      // Wait for all fetch operations to complete
      const providerConfigs = await Promise.all(fetchPromises);

      // Filter out any null/undefined values and return the valid data
      return providerConfigs.filter((config) => config !== null);
    } catch (error) {
      console.error('Error fetching provider configs:', error);
      return []; // Return an empty array in case of error
    }
  };
  const [configs, setConfigs] = useState<ProviderConfigs[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDataAndUpdateState = async () => {
      setIsLoading(true);
      try {
        await fetchProviderConfigsData();
        const finalData = await fetchProviderConfigs();

        setConfigs(finalData);
        if (finalData.length > 0) {
          setIsLoading(false);
        }
      } catch (_) {
        setIsLoading(false);
      }
    };

    fetchDataAndUpdateState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return {
    data: configs,
    error: error as APIError,
    isLoading: isLoading,
    isValidating: isValidating,
  };
};

export const useApiResourceMutation = <T>(
  resource: Resource<T>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config?: SWRMutationConfiguration<T, any, any, any>,
) => {
  const apiConfig = useContext(ApiConfigContext);

  const { data, trigger, error, reset, isMutating } = useSWRMutation(
    resource.path === null
      ? null //TODO: is null a valid key?
      : [resource.path, apiConfig],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ([path, apiConfig]: [path: string, config: ApiConfig], arg: any) =>
      fetchApiServerJson<T>(path, apiConfig, resource.jq, resource.method, JSON.stringify(arg.arg)),
    config,
  );

  return {
    data,
    trigger,
    error: error as APIError,
    reset,
    isMutating,
  };
};

//Reloads this resource (e.g. after a modification was made to the backend)
export function useRevalidateApiResource<T>(resource: Resource<T>) {
  const { mutate } = useSWRConfig();
  const apiConfig = useContext(ApiConfigContext);

  const onRevalidate = (options?: MutatorOptions) => {
    return mutate(
      resource.path === null
        ? null //TODO: is null a valid key?
        : [resource.path, apiConfig],
      undefined,
      options,
    );
  };

  return onRevalidate;
}

export function useMultipleApiResources<T>(
  namespaces: string[],
  getResource: (namespace: string) => { path: string | null },
) {
  const apiConfig = useContext(ApiConfigContext);
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (namespaces.length === 0) {
      setData([]);
      setError(null);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const results = await fetchMultipleResources<T>(namespaces, getResource, apiConfig);
        setData(results);
      } catch (err) {
        setError(err as Error);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [namespaces, getResource, apiConfig]);

  return { data, isLoading, error };
}

async function fetchMultipleResources<T>(
  namespaces: string[],
  getResource: (namespace: string) => { path: string | null },
  apiConfig: ApiConfig,
): Promise<T[]> {
  const paths = namespaces.map((ns) => getResource(ns).path).filter((path): path is string => !!path);

  const results = await Promise.allSettled(paths.map((path) => fetchApiServerJson(path, apiConfig)));

  const data: T[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      const res = result.value;
      if (res && typeof res === 'object' && 'items' in res) {
        const items = (res as { items?: unknown }).items;
        if (Array.isArray(items)) {
          data.push(...(items as T[]));
        }
      }
    }
  }

  return data;
}
