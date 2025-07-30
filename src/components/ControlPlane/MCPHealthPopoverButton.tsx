import {
  AnalyticalTable,
  Icon,
  Popover,
  FlexBox,
  FlexBoxJustifyContent,
  Button,
  PopoverDomRef,
} from '@ui5/webcomponents-react';
import { AnalyticalTableColumnDefinition } from '@ui5/webcomponents-react/wrappers';
import PopoverPlacement from '@ui5/webcomponents/dist/types/PopoverPlacement.js';
import '@ui5/webcomponents-icons/dist/copy';
import { JSX, useRef, useState, MouseEvent, ReactNode } from 'react';
import {
  ControlPlaneStatusType,
  ReadyStatus,
  ControlPlaneStatusCondition,
} from '../../lib/api/types/crate/controlPlanes';
import ReactTimeAgo from 'react-time-ago';
import { AnimatedHoverTextButton } from '../Helper/AnimatedHoverTextButton.tsx';
import { useTranslation } from 'react-i18next';
import { useLink } from '../../lib/shared/useLink.ts';
import TooltipCell from '../Shared/TooltipCell.tsx';

interface CellData<T> {
  cell: {
    value: ReactNode;
  };
  row: {
    original: T;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

type MCPHealthPopoverButtonProps = {
  mcpStatus: ControlPlaneStatusType | undefined;
  projectName: string;
  workspaceName: string;
  mcpName: string;
};

const MCPHealthPopoverButton = ({ mcpStatus, projectName, workspaceName, mcpName }: MCPHealthPopoverButtonProps) => {
  const popoverRef = useRef<PopoverDomRef>(null);
  const [open, setOpen] = useState(false);
  const { githubIssuesSupportTicket } = useLink();
  const { t } = useTranslation();

  const handleOpenerClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (popoverRef.current) {
      (popoverRef.current as unknown as { opener: EventTarget | null }).opener = e.target;
      setOpen((prev) => !prev);
    }
  };

  const getTicketTitle = (): string => {
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

  const constructGithubIssuesLink = (): string => {
    const clusterDetails = `${projectName}/${workspaceName}/${mcpName}`;

    const statusDetails = mcpStatus?.conditions
      ? `${t('MCPHealthPopoverButton.statusDetailsLabel')}: ${mcpStatus.status}\n\n${t('MCPHealthPopoverButton.detailsLabel')}\n` +
        mcpStatus.conditions
          .map((condition: ControlPlaneStatusCondition) => {
            let text = `- ${condition.type}: ${condition.status}\n`;
            if (condition.reason) text += `  - ${t('MCPHealthPopoverButton.reasonHeader')}: ${condition.reason}\n`;
            if (condition.message) text += `  - ${t('MCPHealthPopoverButton.messageHeader')}: ${condition.message}\n`;
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
      Cell: (instance: CellData<ControlPlaneStatusCondition>) => {
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
      Cell: (instance: CellData<ControlPlaneStatusCondition>) => {
        return <TooltipCell>{instance.cell.value}</TooltipCell>;
      },
    },
    {
      Header: t('MCPHealthPopoverButton.messageHeader'),
      accessor: 'message',
      width: 350,
      Cell: (instance: CellData<ControlPlaneStatusCondition>) => {
        return <TooltipCell>{instance.cell.value}</TooltipCell>;
      },
    },
    {
      Header: t('MCPHealthPopoverButton.reasonHeader'),
      accessor: 'reason',
      width: 100,
      Cell: (instance: CellData<ControlPlaneStatusCondition>) => {
        return <TooltipCell>{instance.cell.value}</TooltipCell>;
      },
    },
    {
      Header: t('MCPHealthPopoverButton.transitionHeader'),
      accessor: 'lastTransitionTime',
      width: 110,
      Cell: (instance: CellData<ControlPlaneStatusCondition>) => {
        const rawDate = instance.cell.value;
        const date = new Date(rawDate as string);
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
        <StatusTable
          status={mcpStatus}
          tableColumns={statusTableColumns}
          githubIssuesLink={constructGithubIssuesLink()}
        />
      </Popover>
    </div>
  );
};

export default MCPHealthPopoverButton;

type StatusTableProps = {
  status: ControlPlaneStatusType | undefined;
  tableColumns: AnalyticalTableColumnDefinition[];
  githubIssuesLink: string;
};

const StatusTable = ({ status, tableColumns, githubIssuesLink }: StatusTableProps) => {
  const { t } = useTranslation();

  const sortedConditions = status?.conditions ? [...status.conditions].sort((a, b) => (a.type < b.type ? -1 : 1)) : [];

  return (
    <div style={{ width: 770 }}>
      <AnalyticalTable scaleWidthMode="Default" columns={tableColumns} data={sortedConditions} />
      <FlexBox justifyContent={FlexBoxJustifyContent.End} style={{ marginTop: '0.5rem' }}>
        <a href={githubIssuesLink} target="_blank" rel="noreferrer">
          <Button>{t('MCPHealthPopoverButton.createSupportTicketButton')}</Button>
        </a>
      </FlexBox>
    </div>
  );
};

const getIconForOverallStatus = (status: ReadyStatus | undefined): JSX.Element => {
  switch (status) {
    case ReadyStatus.Ready:
      return <Icon style={{ color: 'green' }} name="sap-icon://sys-enter" />;
    case ReadyStatus.NotReady:
      return <Icon style={{ color: 'red' }} name="sap-icon://pending" />;
    case ReadyStatus.InDeletion:
      return <Icon style={{ color: 'orange' }} name="sap-icon://delete" />;
    default:
      return <></>;
  }
};
