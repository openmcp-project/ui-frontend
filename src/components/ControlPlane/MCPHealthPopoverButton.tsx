import {
  AnalyticalTable,
  Icon,
  Popover,
  FlexBox,
  FlexBoxJustifyContent,
  Button,
} from '@ui5/webcomponents-react';
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
import { useFrontendConfig } from '../../context/FrontendConfigContext.tsx';
export default function MCPHealthPopoverButton({
  mcpStatus,
  projectName,
  workspaceName,
  mcpName,
}: {
  mcpStatus: ControlPlaneStatusType | undefined;
  projectName?: string;
  workspaceName?: string;
  mcpName?: string;
}) {
  const popoverRef = useRef(null);
  const [open, setOpen] = useState(false);
  const { links } = useFrontendConfig();

  const { t } = useTranslation();

  const handleOpenerClick = (e: any) => {
    if (popoverRef.current) {
      const ref = popoverRef.current as any;
      ref.opener = e.target;
      setOpen((prev) => !prev);
    }
  };

  const handleCopyStatusClick = () => {
    const clusterDetails = `${projectName}/${workspaceName}/${mcpName}`;

    const statusDetails = mcpStatus?.conditions
      ? `${t('MCPHealthPopoverButton.statusDetailsLabel')}: ${mcpStatus.status}\n\n${t('MCPHealthPopoverButton.detailsLabel')}\n` +
        mcpStatus.conditions
          .map((condition) => {
            let text = `- ${condition.type}: ${condition.status}\n`;
            if (condition.reason)
              text += `  - ${t('MCPHealthPopoverButton.reasonHeader')}: ${condition.reason}\n`;
            if (condition.message)
              text += `  - ${t('MCPHealthPopoverButton.messageHeader')}: ${condition.message}\n`;
            return text;
          })
          .join('')
      : '';

    const params = new URLSearchParams({
      template: t('MCPHealthPopoverButton.templateId'),
      title: `[${clusterDetails}]: ${
        mcpStatus?.status === ReadyStatus.NotReady
          ? t('MCPHealthPopoverButton.supportTicketTitle')
          : t('MCPHealthPopoverButton.supportTicketIssues')
      }`,
      'cluster-link': clusterDetails,
      'what-happened': statusDetails,
    });

    window.open(`${links.COM_PAGE_SUPPORT_ISSUE}?${params}`, '_blank');
  };

  const statusTableColumns: AnalyticalTableColumnDefinition[] = [
    {
      Header: t('MCPHealthPopoverButton.statusHeader'),
      accessor: 'status',
      width: 50,
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
        {
          <StatusTable
            status={mcpStatus}
            tableColumns={statusTableColumns}
            onCopyClick={handleCopyStatusClick}
          />
        }
      </Popover>
    </div>
  );
}

function StatusTable({
  status,
  tableColumns,
  onCopyClick,
}: {
  status: ControlPlaneStatusType | undefined;
  tableColumns: AnalyticalTableColumnDefinition[];
  onCopyClick: () => void;
}) {
  const showSupportButton =
    status?.status === ReadyStatus.NotReady ||
    status?.status === ReadyStatus.InDeletion;

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
      {showSupportButton && (
        <FlexBox
          justifyContent={FlexBoxJustifyContent.End}
          style={{ marginTop: '0.5rem' }}
        >
          <Button onClick={onCopyClick}>Create Support Ticket</Button>
        </FlexBox>
      )}
    </div>
  );
}

export function getIconForOverallStatus(
  status: ReadyStatus | undefined,
): JSX.Element {
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
