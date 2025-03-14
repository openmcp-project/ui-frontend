import { Resource } from "../resource";

//TODO: type any to correct type and adapt the jq query to the required paramters
export const ListProviders: Resource<any> = {
    path: "/apis/pkg.crossplane.io/v1/providers",
    jq: "[.items[]]",
  };