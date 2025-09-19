import { Panel } from '@ui5/webcomponents-react';
import FluxList from '../../../components/ControlPlane/FluxList';
import styles from '../pages/McpPage.module.css';

export function GitOpsDetailsTable() {
  return (
    <div className={styles.tableSection}>
      <Panel headerText="Flux List">
        <FluxList />
      </Panel>
      <div className={styles.detailsPanelBottom} />
    </div>
  );
}
