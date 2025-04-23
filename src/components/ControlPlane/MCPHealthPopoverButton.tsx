import { AnalyticalTable, Icon, Popover } from '@ui5/webcomponents-react';
import { AnalyticalTableColumnDefinition } from '@ui5/webcomponents-react/wrappers';
import PopoverPlacement from '@ui5/webcomponents/dist/types/PopoverPlacement.js';
import '@ui5/webcomponents-icons/dist/copy';
import { JSX, useRef, useState } from 'react';
import {
  ControlPlaneStatusType,
  ReadyStatus,
} from '../../lib/api/types/crate/controlPlanes';
import ReactTimeAgo from 'react-time-ago';
import { AnimatedHoverTextButton } from '../Helper/AnimatedHoverTextButton.tsx';
import { useTranslation } from 'react-i18next';

export default function MCPHealthPopoverButton({
  mcpStatus,
}: {
  mcpStatus: ControlPlaneStatusType | undefined;
}) {
  const popoverRef = useRef(null);
  const [open, setOpen] = useState(false);

  const { t } = useTranslation();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleOpenerClick = (e: any) => {
    if (popoverRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ref = popoverRef.current as any;
      ref.opener = e.target;
      setOpen((prev) => !prev);
    }
  };

  const statusTableColumns: AnalyticalTableColumnDefinition[] = [
    {
      Header: t('MCPHealthPopoverButton.statusHeader'),
      accessor: 'status',
      width: 50,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Cell: (instance: any) => {
        const isReady = instance.cell.value === 'True';
        return (
          <Icon
            style={{ color: isReady ? 'green' : 'red' }}
            name={isReady ? 'sap-icon://sys-enter' : 'sap-icon://pending'}
          />
        );
      },
    },
    {
      Header: t('MCPHealthPopoverButton.typeHeader'),
      accessor: 'type',
    },
    {
      Header: t('MCPHealthPopoverButton.messageHeader'),
      accessor: 'message',
    },
    {
      Header: t('MCPHealthPopoverButton.reasonHeader'),
      accessor: 'reason',
    },
    {
      Header: t('MCPHealthPopoverButton.transitionHeader'),
      accessor: 'lastTransitionTime',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Cell: (instance: any) => {
        return <ReactTimeAgo date={new Date(instance.cell.value)} />;
      },
    },
  ];

  return (
    <div className="component-title-row">
      <AnimatedHoverTextButton
        icon={getIconForOverallStatus(mcpStatus?.status)}
        text={mcpStatus?.status ?? ''}
        onClick={handleOpenerClick}
      />
      <Popover ref={popoverRef} open={open} placement={PopoverPlacement.Bottom}>
        {<StatusTable status={mcpStatus} tableColumns={statusTableColumns} />}
      </Popover>
    </div>
  );
}

function StatusTable({
  status,
  tableColumns,
}: {
  status: ControlPlaneStatusType | undefined;
  tableColumns: AnalyticalTableColumnDefinition[];
}) {
  return (
    <div style={{ width: 600 }}>
      <AnalyticalTable
        scaleWidthMode="Smart"
        columns={tableColumns}
        data={
          status?.conditions.sort((a, b) => {
            return a.type < b.type ? -1 : 1;
          }) ?? []
        }
      />
    </div>
  );
}

function getIconForOverallStatus(status: ReadyStatus | undefined): JSX.Element {
  switch (status) {
    case ReadyStatus.Ready:
      return <Icon style={{ color: 'green' }} name="sap-icon://sys-enter" />;
    case ReadyStatus.NotReady:
      return <Icon style={{ color: 'red' }} name="sap-icon://pending" />;
    case ReadyStatus.InDeletion:
      return <Icon style={{ color: 'orange' }} name="sap-icon://delete" />;
    case undefined:
      return <></>;
  }
}
