import { Providers } from "./Providers.tsx";
import { ProvidersConfig } from "./ProvidersConfig.tsx";
import { ManagedResources } from './ManagedResources';

export default function ProvidersList() {
  return (
    <>
      <Providers />
      <ProvidersConfig />
      <ManagedResources />
    </>
  );
}
