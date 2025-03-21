import { useContext } from 'react';
import useSWR, { SWRConfiguration, useSWRConfig } from 'swr';
import { fetchApiServerJson } from './fetch';
import { ApiConfigContext } from '../../components/Shared/k8s';
import { APIError } from './error';
import { ApiConfig } from './types/apiConfig';
import { Resource } from './types/resource';
import useSWRMutation, { SWRMutationConfiguration } from 'swr/mutation';
import { MutatorOptions } from 'swr/_internal';

export { useApiResource as default };

export const useApiResource = <T>(
  resource: Resource<T>,
  config?: SWRConfiguration,
) => {
  const apiConfig = useContext(ApiConfigContext);

  const { data, error, isLoading, isValidating } = useSWR(
    resource.path === null
      ? null //TODO: is null a valid key?
      : [resource.path, apiConfig],
    ([path, apiConfig]) =>
      fetchApiServerJson<T>(
        path,
        apiConfig,
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

export const useApiResourceMutation = <T>(
  resource: Resource<T>,
  config?: SWRMutationConfiguration<T, any, any, any>,
) => {
  const apiConfig = useContext(ApiConfigContext);

  const { data, trigger, error, reset, isMutating } = useSWRMutation(
    resource.path === null
      ? null //TODO: is null a valid key?
      : [resource.path, apiConfig],
    ([path, apiConfig]: [path: string, config: ApiConfig], arg: any) =>
      fetchApiServerJson<T>(
        path,
        apiConfig,
        resource.jq,
        resource.method,
        JSON.stringify(arg.arg),
      ),
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
