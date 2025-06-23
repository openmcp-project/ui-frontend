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
import { useLink } from '../../lib/shared/useLink.ts';
import TooltipCell from '../Shared/TooltipCell.tsx';
export default function MCPHealthPopoverButton({
  mcpStatus,
  projectName,
  workspaceName,
  mcpName,
}: {
  mcpStatus: ControlPlaneStatusType | undefined;
  projectName: string;
  workspaceName: string;
  mcpName: string;
}) {
  const popoverRef = useRef(null);
  const [open, setOpen] = useState(false);
  const { githubIssuesSupportTicket } = useLink();

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

  const getTicketTitle = () => {
    switch (mcpStatus?.status) {
      case ReadyStatus.Ready:
        return t('MCPHealthPopoverButton.supportTicketTitleReady');
      case ReadyStatus.NotReady:
        return t('MCPHealthPopoverButton.supportTicketTitleNotReady');
      case ReadyStatus.InDeletion:
        return t('MCPHealthPopoverButton.supportTicketTitleDeletion');
      default:
        return t('MCPHealthPopoverButton.supportTicketTitleIssues');
    }
  };

  const constructGithubIssuesLink = () => {
    const clusterDetails = `${projectName}/${workspaceName}/${mcpName}`;

    const statusDetails = mcpStatus?.conditions
      ? `${t('MCPHealthPopoverButton.statusDetailsLabel')}: ${mcpStatus.status}\n\n${t('MCPHealthPopoverButton.detailsLabel')}\n` +
        mcpStatus?.conditions
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
      template: '1-mcp_issue.yml',
      title: `[${clusterDetails}]: ${getTicketTitle()}`,
      'cluster-link': clusterDetails,
      'what-happened': statusDetails,
    });

    return `${githubIssuesSupportTicket}?${params}`;
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
      width: 150,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Cell: (instance: any) => {
        return <TooltipCell>{instance.cell.value}</TooltipCell>;
      },
    },
    {
      Header: t('MCPHealthPopoverButton.messageHeader'),
      accessor: 'message',
      width: 350,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Cell: (instance: any) => {
        return <TooltipCell>{instance.cell.value}</TooltipCell>;
      },
    },
    {
      Header: t('MCPHealthPopoverButton.reasonHeader'),
      accessor: 'reason',
      width: 100,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Cell: (instance: any) => {
        return <TooltipCell>{instance.cell.value}</TooltipCell>;
      },
    },
    {
      Header: t('MCPHealthPopoverButton.transitionHeader'),
      accessor: 'lastTransitionTime',
      width: 110,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Cell: (instance: any) => {
        const rawDate = instance.cell.value;
        const date = new Date(rawDate);

        return (
          <TooltipCell>
            <ReactTimeAgo date={date} />
          </TooltipCell>
        );
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
            githubIssuesLink={constructGithubIssuesLink()}
          />
        }
      </Popover>
    </div>
  );
}

function StatusTable({
  status,
  tableColumns,
  githubIssuesLink,
}: {
  status: ControlPlaneStatusType | undefined;
  tableColumns: AnalyticalTableColumnDefinition[];
  githubIssuesLink: string;
}) {
  const { t } = useTranslation();

  return (
    <div style={{ width: 770 }}>
      <AnalyticalTable
        scaleWidthMode="Default"
        columns={tableColumns}
        data={
          status?.conditions?.sort((a, b) => {
            return a.type < b.type ? -1 : 1;
          }) ?? []
        }
      />
      <FlexBox
        justifyContent={FlexBoxJustifyContent.End}
        style={{ marginTop: '0.5rem' }}
      >
        <a href={githubIssuesLink} target="_blank" rel="noreferrer">
          <Button>
            {t('MCPHealthPopoverButton.createSupportTicketButton')}
          </Button>
        </a>
      </FlexBox>
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
