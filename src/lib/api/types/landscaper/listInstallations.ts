import { Resource } from "../resource";

interface GraphInstallationsType {
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
  
  export const ListGraphInstallations: Resource<GraphInstallationsType[]> = {
    path: "/apis/landscaper.gardener.cloud/v1alpha1/installations",
    jq: "[.items[] | {metadata: .metadata | {name, namespace, uid, ownerReferences: (try [{uid: .ownerReferences[].uid}] catch [])}, status: .status | {phase}}]",
  };
  
  interface TableInstallationsType {
    metadata: {
      name: string;
      namespace: string;
      creationTimestamp: string;
    };
    status: {
      phase: string;
    };
  }
  
  export const ListTableInstallations: Resource<TableInstallationsType[]> = {
    path: "/apis/landscaper.gardener.cloud/v1alpha1/installations",
    jq: "[.items[] | {metadata: .metadata | {name, namespace, creationTimestamp}, status: .status | {phase}}]",
  };