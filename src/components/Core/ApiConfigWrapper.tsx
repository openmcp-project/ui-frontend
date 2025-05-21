import { ApiConfigProvider } from '../Shared/k8s/index.ts';
import { Outlet } from 'react-router-dom';
import { generateCrateAPIConfig } from '../../lib/api/types/apiConfig.ts';

// ApiConfigWrapper is a component that provides the ApiConfigProvider with the oidc access token from the oidc context.
export default function ApiConfigWrapper() {
  return (
    <>
      <ApiConfigProvider apiConfig={generateCrateAPIConfig()}>
        <Outlet />
      </ApiConfigProvider>
    </>
  );
}
