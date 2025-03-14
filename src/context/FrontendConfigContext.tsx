import { FC, ReactNode, createContext, useContext } from "react";
import { DocLinkCreator } from "../lib/shared/links";
import { useTranslation } from "react-i18next";

export enum Landscape {
  Live = "LIVE",
  Canary = "CANARY",
  Staging = "STAGING",
  Development = "DEV",
}

export interface FrontendConfig {
  backendUrl: string;
  landscape?: Landscape;
  documentationBaseUrl: string;
}

export interface FrontendConfigProviderProps extends FrontendConfig {
  links: DocLinkCreator;
}

const FrontendConfigContext = createContext<FrontendConfigProviderProps | null>(null);

export const useFrontendConfig = () => {
  const c = useContext(FrontendConfigContext);
  const { t } = useTranslation();

  if (!c) {
    throw new Error(t('FrontendConfigContext.errorMessage'));
  }
  return c;
}

export const FrontendConfigProvider: FC<{ children: ReactNode, config: FrontendConfig }> = ({ children, config }) => {
  const docLinks = new DocLinkCreator(config.documentationBaseUrl);
  return (
    <FrontendConfigContext.Provider value={
      {
        links: docLinks,
        backendUrl: config.backendUrl,
        landscape: config.landscape,
        documentationBaseUrl: config.documentationBaseUrl,
      }
    } >
      {children}
    </FrontendConfigContext.Provider >
  )
}

export async function LoadFrontendConfig(): Promise<FrontendConfig> {
  return fetch("/frontend-config.json").then((res) => res.json());
}