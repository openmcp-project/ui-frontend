import { Panel } from '@ui5/webcomponents-react';
import { ManagedResources } from '../../../components/ControlPlane/ManagedResources';
import { Providers } from '../../../components/ControlPlane/Providers';
import { ProvidersConfig } from '../../../components/ControlPlane/ProvidersConfig';
import styles from '../pages/McpPage.module.css';

export function CrossplaneDetailsTable() {
  return (
    <div className={styles.tableSection}>
      <Panel headerText="Details">
        <div className={styles.crossplaneTableElementFirst}>
          <div className="crossplane-table-element">
            <Providers />
          </div>
          <div className={`crossplane-table-element ${styles.crossplaneTableElement}`}>
            <ProvidersConfig />
          </div>
          <div className={`crossplane-table-element ${styles.crossplaneTableElement}`}>
            <ManagedResources />
          </div>
        </div>
      </Panel>
      <div className={styles.detailsPanelBottom} />
    </div>
  );
}