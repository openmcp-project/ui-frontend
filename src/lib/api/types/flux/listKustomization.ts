import { Resource } from '../resource';

export const FluxKustomization: Resource<any> = {
  path: '/apis/kustomize.toolkit.fluxcd.io/v1/kustomizations',
  jq: '[.items[]]',
};
