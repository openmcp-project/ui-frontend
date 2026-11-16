import { useMemo, useSyncExternalStore } from 'react';
import { deniedSnapshot, subscribeDenied } from './downstreamAccessStore.ts';

export function useDownstreamAccess(): (key: string) => boolean {
  const snapshot = useSyncExternalStore(subscribeDenied, deniedSnapshot, () => '[]');
  return useMemo(() => {
    const denied = new Set<string>(JSON.parse(snapshot));
    return (key: string) => denied.has(key);
  }, [snapshot]);
}
