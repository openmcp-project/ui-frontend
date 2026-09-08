import { Icon } from '@ui5/webcomponents-react';
import { JSX } from 'react';
import { ReadyStatus } from '../../spaces/onboarding/types/ControlPlane';
import styles from './MCPHealthPopoverButton.module.css';

export const getClassNameForOverallStatus = (status: string | undefined): string => {
  switch (status) {
    case ReadyStatus.Ready:
      return 'ready';
    case ReadyStatus.NotReady:
      return 'not-ready';
    case ReadyStatus.Progressing:
      return 'not-ready';
    case ReadyStatus.InDeletion:
      return 'deleting';
    default:
      return '';
  }
};

export const getIconForOverallStatus = (status: string | undefined): JSX.Element => {
  switch (status) {
    case ReadyStatus.Ready:
      return <Icon className={styles.iconReady} name="sap-icon://sys-enter" />;
    case ReadyStatus.NotReady:
      return <Icon className={styles.iconNotReady} name="sap-icon://pending" />;
    case ReadyStatus.Progressing:
      return <Icon className={styles.iconNotReady} name="sap-icon://pending" />;
    case ReadyStatus.InDeletion:
      return <Icon className={styles.iconInDeletion} name="sap-icon://delete" />;
    default:
      return <></>;
  }
};
