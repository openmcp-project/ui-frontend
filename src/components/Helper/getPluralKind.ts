import { ManagedResourceItem } from '../../lib/shared/types';

export const getPluralKind = (item: ManagedResourceItem, kindMapping: Record<string, string>): string => {
  const singularKind = (item?.kind ?? '').toLowerCase();
  return kindMapping[singularKind] ?? '';
};
