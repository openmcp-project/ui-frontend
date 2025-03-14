import { Resource } from "../resource";

//TODO: typing and jq query
export const CustomResourceDefinitions: Resource<any> = {
    path: "/apis/apiextensions.k8s.io/v1/customresourcedefinitions",
    jq: "[.items[]]",
  };