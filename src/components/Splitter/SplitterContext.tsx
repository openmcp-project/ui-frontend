import { createContext, ReactNode, use, useCallback, useMemo, useState } from 'react';
import { ApiConfigProvider } from '../Shared/k8s';
import { ApiConfig } from '../../lib/api/types/apiConfig.ts';

interface SplitterContextType {
  isAsideVisible: boolean;
  asideContent: ReactNode;
  closeAside: () => void;
  openInAside: (content: ReactNode) => void;
  openInAsideWithApiConfig: (content: ReactNode, apiConfig: ApiConfig) => void;
}

const SplitterContext = createContext<SplitterContextType | null>(null);

export function SplitterProvider({ children }: { children: ReactNode }) {
  const [isAsideVisible, setIsAsideVisible] = useState(false);
  const [asideContent, setAsideContent] = useState<ReactNode | null>(null);

  const openInAside = useCallback((node: ReactNode) => {
    setAsideContent(node);
    setIsAsideVisible(true);
  }, []);

  const openInAsideWithApiConfig = useCallback((node: ReactNode, apiConfig: ApiConfig) => {
    const projectName = apiConfig.mcpConfig?.projectName ?? '';
    const workspaceName = apiConfig.mcpConfig?.workspaceName ?? '';
    const controlPlaneName = apiConfig.mcpConfig?.controlPlaneName ?? '';
    setAsideContent(
      <ApiConfigProvider
        apiConfig={{
          mcpConfig:
            projectName && workspaceName && controlPlaneName
              ? {
                  projectName,
                  workspaceName,
                  controlPlaneName,
                }
              : undefined,
        }}
      >
        {node}
      </ApiConfigProvider>,
    );
    setIsAsideVisible(true);
  }, []);

  const closeAside = useCallback(() => {
    setIsAsideVisible(false);
    setAsideContent(null);
  }, []);

  const value = useMemo(() => {
    return { isAsideVisible, asideContent, closeAside, openInAside, openInAsideWithApiConfig };
  }, [isAsideVisible, asideContent, closeAside, openInAside, openInAsideWithApiConfig]);

  return <SplitterContext value={value}>{children}</SplitterContext>;
}

export function useSplitter() {
  const context = use(SplitterContext);
  if (!context) {
    throw new Error('useSplitter must be used within an SplitterProvider.');
  }
  return context;
}
