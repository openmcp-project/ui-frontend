import { Resource } from '../resource';

//TODO: typing and jq query
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const CustomResourceDefinitions: Resource<any> = {
  path: '/apis/apiextensions.k8s.io/v1/customresourcedefinitions',
  jq: '[.items[]]',
};
