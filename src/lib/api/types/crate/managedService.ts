export interface ManagedServiceVersion {
  version: string;
}

export interface ManagedService {
  name: string;
  kind: string;
  apiVersion: string;
  versions: ManagedServiceVersion[];
}

export interface CrossplaneProvider {
  name: string;
  versions: ManagedServiceVersion[];
}

export interface ManagedServiceCatalog {
  services: ManagedService[];
  crossplaneProviders: CrossplaneProvider[];
}
