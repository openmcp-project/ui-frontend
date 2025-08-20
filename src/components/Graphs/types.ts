import { ManagedResourceItem } from '../../lib/shared/types';

export type ColorBy = 'provider' | 'source' | 'flux';

export interface NodeData {
  [key: string]: unknown;
  id: string;
  label: string;
  type?: string;
  providerConfigName: string;
  providerType: string;
  status: string;
  transitionTime?: string;
  statusMessage?: string;
  fluxName?: string;
  parentId?: string;
  extraRefs: string[];
  item: ManagedResourceItem;
  onYamlClick: (item: ManagedResourceItem) => void;
}
