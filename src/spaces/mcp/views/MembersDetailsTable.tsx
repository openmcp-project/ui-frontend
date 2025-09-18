import { Panel } from '@ui5/webcomponents-react';
import { MemberTable } from '../../../components/Members/MemberTable';
import styles from '../pages/McpPage.module.css';

interface RoleBinding {
  role: string;
  subjects: {
    kind: string;
    name: string;
  }[];
  namespace?: string;
}

interface MembersDetailsTableProps {
  mcp: any;
}

export function MembersDetailsTable({ mcp }: MembersDetailsTableProps) {
  return (
    <div className={styles.tableSection}>
      <Panel headerText="Members List">
        <MemberTable
          members={
            mcp?.spec?.authorization?.roleBindings?.map((binding: RoleBinding) => ({
              name: (binding.subjects?.[0]?.name || 'Unknown').replace(/^openmcp:/, ''),
              kind: binding.subjects?.[0]?.kind || 'Unknown',
              roles: binding.role ? [binding.role] : [],
              namespace: binding.namespace || '',
            })) || []
          }
          requireAtLeastOneMember={false}
        />
      </Panel>
      <div className={styles.detailsPanelBottom} />
    </div>
  );
}
