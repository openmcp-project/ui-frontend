import { Resource } from "../resource";

interface GraphExecutionsType {
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
  
  export const ListGraphExecutions: Resource<GraphExecutionsType[]> = {
    path: "/apis/landscaper.gardener.cloud/v1alpha1/executions",
    jq: "[.items[] | {metadata: .metadata | {name, namespace, uid, ownerReferences: (try [{uid: .ownerReferences[].uid}] catch [])}, status: .status | {phase}}]",
  };