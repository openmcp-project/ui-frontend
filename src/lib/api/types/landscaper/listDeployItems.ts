import { Resource } from '../resource';

interface GraphDeployItemsType {
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

export const ListGraphDeployItems: Resource<GraphDeployItemsType[]> = {
  path: '/apis/landscaper.gardener.cloud/v1alpha1/deployitems',
  jq: '[.items[] | {metadata: .metadata | {name, namespace, uid, ownerReferences: (try [{uid: .ownerReferences[].uid}] catch [])}, status: .status | {phase}}]',
};
