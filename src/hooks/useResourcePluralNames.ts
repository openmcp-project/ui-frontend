import { useMemo } from 'react';
import { useCRDItemsMapping } from '../lib/api/useApiResource';
import { resourcesInterval } from '../lib/shared/constants';

export const useResourcePluralNames = () => {
  const {
    data: kindMapping,
    isLoading,
    error,
  } = useCRDItemsMapping({
    refreshInterval: resourcesInterval,
  });

  const getPluralKind = useMemo(() => {
    return (singularKind: string): string => {
      if (!kindMapping) return '';
      return kindMapping[singularKind.toLowerCase()] ?? '';
    };
  }, [kindMapping]);

  return {
    getPluralKind,
    isLoading,
    error,
  };
};
