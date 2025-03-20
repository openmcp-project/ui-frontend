import { useFrontendConfig } from '../../context/FrontendConfigContext.tsx';

export default function LandscapeLabel() {
  const frontendConfig = useFrontendConfig();
  return <>{`[${frontendConfig.landscape}]`}</>;
}
