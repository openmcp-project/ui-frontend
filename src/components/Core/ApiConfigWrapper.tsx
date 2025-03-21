import { ApiConfigProvider } from '../Shared/k8s/index.ts';
import { Outlet } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import { generateCrateAPIConfig } from '../../lib/api/types/apiConfig.ts';
import { useFrontendConfig } from '../../context/FrontendConfigContext.tsx';

// ApiConfigWrapper is a component that provides the ApiConfigProvider with the oidc access token from the oidc context.
export default function ApiConfigWrapper() {
  const auth = useAuth();
  const token = !auth.isAuthenticated ? '' : auth.user?.access_token;
  const { backendUrl } = useFrontendConfig();

  return (
    <>
      <ApiConfigProvider
        apiConfig={generateCrateAPIConfig(backendUrl, token ?? '')}
      >
        <Outlet />
      </ApiConfigProvider>
    </>
  );
}
