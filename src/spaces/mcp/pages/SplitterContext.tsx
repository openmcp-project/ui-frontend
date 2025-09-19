import { createContext, ReactNode, use, useCallback, useMemo, useState } from 'react';
import {
  Panel,
  SplitterElement,
  SplitterLayout,
  Title,
  Toolbar,
  ToolbarButton,
  ToolbarSpacer,
} from '@ui5/webcomponents-react';
import { YamlIcon } from '../../../components/Yaml/YamlIcon.tsx';

interface SplitterContextType {
  isAsideVisible: boolean;
  close: () => void;
  open: (content: ReactNode) => void;
  content: ReactNode;
}

const SplitterContext = createContext<SplitterContextType | null>(null);

export function SplitterProvider({ children }: { children: ReactNode }) {
  const [isAsideVisible, setIsAsideVisible] = useState(false);
  const [content, setContent] = useState<ReactNode | null>(null);

  const open = useCallback((node: ReactNode) => {
    setContent(node);
    setIsAsideVisible(true);
  }, []);
  const close = useCallback(() => {
    setIsAsideVisible(false);
    setContent(null);
  }, []);

  const value = useMemo(() => {
    return { isAsideVisible, content, close, open };
  }, [isAsideVisible, content, close, open]);

  return <SplitterContext value={value}>{children}</SplitterContext>;
}

export const useSplitter = () => {
  const context = use(SplitterContext);
  if (!context) {
    throw new Error('useSplitter must be used within an SplitterProvider.');
  }
  return context;
};

export interface SplitterProviderProps {
  children: ReactNode;
}
export function MySplitterLayout({ children }: SplitterProviderProps) {
  //const initialAsideWidth = '20rem';
  //const [asideWidth, setAsideWidth] = useState(initialAsideWidth);
  const { isAsideVisible, close, content } = useSplitter();

  return (
    <SplitterLayout
      style={{
        // TODO: 3.25rem = height of shellbar
        width: '100%',
        height: 'calc(100% - 3.25rem)',
      }}
      options={{
        resetOnSizeChange: true,
        resetOnCustomDepsChange: [isAsideVisible],
      }}
      vertical={false}
      onResize={(param) => {
        // TODO: DEBOUNCE!
        //console.log('ASIDE WIDTH', param.areas[1].size.toString() ?? initialAsideWidth);
        //setAsideWidth(param.areas[1].size.toString() + 'px');
      }}
    >
      <SplitterElement size="100%">{children}</SplitterElement>
      {isAsideVisible ? (
        <SplitterElement size={800} minSize={300}>
          {/* Todo. test scrolling*/}
          <div style={{ width: '100%', overflowY: 'scroll' }}>
            <div style={{ width: '100%', height: '100%' }}>
              <Panel
                fixed
                header={
                  <Toolbar>
                    <Title>Details</Title>
                    <ToolbarSpacer />
                    <ToolbarButton icon="sap-icon://navigation-right-arrow" onClick={close} />
                  </Toolbar>
                }
              >
                {content}
              </Panel>
            </div>
          </div>
        </SplitterElement>
      ) : null}
    </SplitterLayout>
  );
}
