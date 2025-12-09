import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCallback } from 'react';

export const useNavigateToTab = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  return useCallback(
    (tab: string, hash?: string) => {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('tab', tab);
      const hashPart = hash ? `#${hash}` : '';
      navigate(`?${newParams.toString()}${hashPart}`);
    },
    [searchParams, navigate],
  );
};
