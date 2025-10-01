import { createContext, ReactNode, use, useCallback, useMemo, useState } from 'react';

interface SplitterContextType {
  isAsideVisible: boolean;
  asideContent: ReactNode;
  closeAside: () => void;
  openInAside: (content: ReactNode) => void;
}

const SplitterContext = createContext<SplitterContextType | null>(null);

export function SplitterProvider({ children }: { children: ReactNode }) {
  const [isAsideVisible, setIsAsideVisible] = useState(false);
  const [asideContent, setAsideContent] = useState<ReactNode | null>(null);

  const openInAside = useCallback((node: ReactNode) => {
    setAsideContent(node);
    setIsAsideVisible(true);
  }, []);

  const closeAside = useCallback(() => {
    setIsAsideVisible(false);
    setAsideContent(null);
  }, []);

  const value = useMemo(() => {
    return { isAsideVisible, asideContent, closeAside, openInAside };
  }, [isAsideVisible, asideContent, closeAside, openInAside]);

  return <SplitterContext value={value}>{children}</SplitterContext>;
}

export function useSplitter() {
  const context = use(SplitterContext);
  if (!context) {
    throw new Error('useSplitter must be used within an SplitterProvider.');
  }
  return context;
}
