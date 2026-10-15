import { FlexBox, Panel, Title } from '@ui5/webcomponents-react';
import { FC, ReactNode } from 'react';
import styles from './IdentityProviders.module.css';

export interface ProviderGroupProps {
  headerText: string;
  headerActions?: ReactNode;
  children: ReactNode;
}

export const ProviderGroup: FC<ProviderGroupProps> = ({ headerText, headerActions, children }) => {
  return (
    <Panel
      className={styles.providerGroupPanel}
      collapsed={false}
      header={
        <FlexBox alignItems="Center" justifyContent="SpaceBetween" className={styles.providerGroupHeader}>
          <Title level="H5" className={styles.providerGroupHeaderTitle}>
            {headerText}
          </Title>
          <FlexBox alignItems="Center" gap={4}>
            {headerActions}
          </FlexBox>
        </FlexBox>
      }
    >
      <div className={styles.providerGroupContent}>{children}</div>
    </Panel>
  );
};
