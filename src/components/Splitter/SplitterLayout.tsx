import { ReactNode } from 'react';
import { SplitterElement, SplitterLayout as Ui5SplitterLayout } from '@ui5/webcomponents-react';
import { useSplitter } from './SplitterContext.tsx';

import styles from './SplitterLayout.module.css';

export interface SplitterLayoutProps {
  children: ReactNode; // main content
}
export function SplitterLayout({ children }: SplitterLayoutProps) {
  const { isAsideVisible, asideContent } = useSplitter();

  return (
    <Ui5SplitterLayout
      className={styles.splitter}
      options={{
        resetOnSizeChange: true,
        resetOnCustomDepsChange: [isAsideVisible],
      }}
    >
      <SplitterElement size="100%">{children}</SplitterElement>

      {isAsideVisible ? (
        <SplitterElement size={800} minSize={300} className={styles.asideContent}>
          {asideContent}
        </SplitterElement>
      ) : null}
    </Ui5SplitterLayout>
  );
}
