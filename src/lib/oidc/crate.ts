import { AuthProviderProps } from 'react-oidc-context';
import { GetAuthPropsForCurrentContext } from './shared.ts';

export function LoadCrateKubeConfig(
  backendUrl: string,
): Promise<AuthProviderProps> {
  const uri = backendUrl + '/.well-known/openmcp/kubeconfig';

  return fetch(uri)
    .then((res) => res.text())
    .then<AuthProviderProps>((data) => {
      const authprops = GetAuthPropsForCurrentContext(data);
      return authprops;
    })
    .catch((error) => {
      console.error(error);
      throw new Error('Failed to load kubeconfig' + error);
    });
}
