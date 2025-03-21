import useApiResource from '../../useApiResource';
import { ListGraphInstallations } from './listInstallations';
import { ListGraphExecutions } from './listExecutions';
import { ListGraphDeployItems } from './listDeployItems';

interface GraphLandscaperResourceType {
  kind: string;
  apiVersion: string;
  metadata: {
    name: string;
    namespace: string;
    uid: string;
    ownerReferences: {
      uid: string;
    }[];
  };
  status: {
    phase: string;
  };
}

export const useLandscaperGraphResources = () => {
  const installations = useApiResource(ListGraphInstallations);
  const executions = useApiResource(ListGraphExecutions);
  const deployItems = useApiResource(ListGraphDeployItems);

  return {
    data: [
      ...(installations.data?.map((m) => {
        return {
          kind: 'Installation',
          apiVersion: 'landscaper.gardener.cloud/v1alpha1',
          ...m,
        };
      }) ?? []),
      ...(executions.data?.map((m) => {
        return {
          kind: 'Execution',
          apiVersion: 'landscaper.gardener.cloud/v1alpha1',
          ...m,
        };
      }) ?? []),
      ...(deployItems.data?.map((m) => {
        return {
          kind: 'DeployItem',
          apiVersion: 'landscaper.gardener.cloud/v1alpha1',
          ...m,
        };
      }) ?? []),
    ] as GraphLandscaperResourceType[],
    error: [installations.error, executions.error, deployItems.error].filter(
      (e) => e !== undefined,
    ),
  };
};
