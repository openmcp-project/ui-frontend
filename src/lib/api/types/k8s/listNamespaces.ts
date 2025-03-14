import { Resource } from "../resource";

interface ListNamespacesType {
    metadata: {
      name: string;
    };
  }
  
  export const ListNamespaces: Resource<ListNamespacesType[]> = {
    path: `/api/v1/namespaces`,
    jq: "[.items[] | {metadata: .metadata | {name}}]",
  };