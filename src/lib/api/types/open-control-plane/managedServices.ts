import { Resource } from '../resource';

export type ManagedServiceVersion = {
  version: string;
};

export type ManagedService = {
  name: string;
  kind: string;
  apiVersion: string;
  versions: ManagedServiceVersion[];
};

export type CrossplaneProvider = {
  name: string;
  versions: ManagedServiceVersion[];
};

export type ManagedServiceResource = {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace: string;
  };
  spec: {
    services: ManagedService[];
    crossplaneProviders: CrossplaneProvider[];
  };
};

export const ManagedServiceRequest: Resource<ManagedServiceResource> = {
  path: '/apis/open-control-plane.io/v1/managedservices/catalog',
};
