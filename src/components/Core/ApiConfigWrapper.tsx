import { useMemo } from 'react';
import { ApiConfigProvider } from '../Shared/k8s/index.ts';
import { Outlet } from 'react-router-dom';
import { generateCrateAPIConfig } from '../../lib/api/types/apiConfig.ts';

// ApiConfigWrapper is a component that provides the ApiConfigProvider with the oidc access token from the oidc context.
export default function ApiConfigWrapper() {
  // Memoise so the context value is referentially stable across re-renders;
  // a fresh object would invalidate every downstream useMemo/useEffect that
  // depends on apiConfig. See issue #653.
  const apiConfig = useMemo(() => generateCrateAPIConfig(), []);
  return (
    <ApiConfigProvider apiConfig={apiConfig}>
      <Outlet />
    </ApiConfigProvider>
  );
}
