import { createContext, ReactNode } from 'react';
import { ApiConfig } from '../../../lib/api/types/apiConfig';

interface Props {
  apiConfig: ApiConfig;
  children?: ReactNode;
}

export const ApiConfigContext = createContext({} as ApiConfig);

export const ApiConfigProvider = ({ children, apiConfig }: Props) => {
  return (
    <ApiConfigContext.Provider value={apiConfig}>
      {children}
    </ApiConfigContext.Provider>
  );
};
