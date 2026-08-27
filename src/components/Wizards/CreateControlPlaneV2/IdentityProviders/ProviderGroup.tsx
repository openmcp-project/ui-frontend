import { FlexBox, Panel, Title } from '@ui5/webcomponents-react';
import { FC, ReactNode, useMemo } from 'react';
import styles from './IdentityProviders.module.css';

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function accentColorForName(name: string): string {
  const index = (hashString(name.toLowerCase()) % 10) + 1;
  return `var(--sapAvatar_${index}_Background)`;
}

export interface ProviderGroupProps {
  headerText: string;
  headerActions?: ReactNode;
  children: ReactNode;
  collapsed?: boolean;
  dimmed?: boolean;
  accentName?: string;
}

export const ProviderGroup: FC<ProviderGroupProps> = ({
  headerText,
  headerActions,
  children,
  collapsed = false,
  dimmed = false,
  accentName,
}) => {
  const accentColor = useMemo(() => (accentName ? accentColorForName(accentName) : undefined), [accentName]);

  return (
    <Panel
      className={`${styles.providerGroupPanel}${dimmed ? ` ${styles.providerGroupPanelDimmed}` : ''}`}
      collapsed={collapsed}
      fixed={collapsed}
      style={
        accentColor
          ? ({
              '--sapGroup_ContentBackground': `color-mix(in srgb, ${accentColor} 12%, var(--sapBackgroundColor, #fafafa))`,
              '--sapGroup_TitleBackground': `color-mix(in srgb, ${accentColor} 12%, var(--sapBackgroundColor, #fafafa))`,
            } as React.CSSProperties)
          : undefined
      }
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
