import { ReactNode, createContext, use } from 'react';
import { DocLinkCreator } from '../lib/shared/links';

export enum Landscape {
  Live = 'LIVE',
  Canary = 'CANARY',
  Staging = 'STAGING',
  Development = 'DEV',
}

interface FrontendConfigContextProps {
  backendUrl: string;
  landscape?: Landscape;
  documentationBaseUrl: string;
  links: DocLinkCreator;
}

const FrontendConfigContext = createContext<FrontendConfigContextProps | null>(
  null,
);

const fetchPromise = fetch('/frontend-config.json').then((res) => res.json());

interface FrontendConfigProviderProps {
  children: ReactNode;
}

export function FrontendConfigProvider({
  children,
}: FrontendConfigProviderProps) {
  const config = use(fetchPromise);
  const docLinks = new DocLinkCreator(config.documentationBaseUrl);
  const value: FrontendConfigContextProps = {
    links: docLinks,
    backendUrl: config.backendUrl,
    landscape: config.landscape,
    documentationBaseUrl: config.documentationBaseUrl,
  };

  return (
    <FrontendConfigContext value={value}>{children}</FrontendConfigContext>
  );
}

export const useFrontendConfig = () => {
  const context = use(FrontendConfigContext);

  if (!context) {
    throw new Error(
      'useFrontendConfig must be used within a FrontendConfigProvider.',
    );
  }
  return context;
};
