import {
  Icon,
  ResponsivePopover,
  FlexBox,
  FlexBoxJustifyContent,
  Button,
  PopoverDomRef,
  ButtonDomRef,
  LinkDomRef,
} from '@ui5/webcomponents-react';
import PopoverPlacement from '@ui5/webcomponents/dist/types/PopoverPlacement.js';
import '@ui5/webcomponents-icons/dist/copy';
import { JSX, useRef, useState } from 'react';
import type { ButtonClickEventDetail } from '@ui5/webcomponents/dist/Button.js';
import type { LinkClickEventDetail } from '@ui5/webcomponents/dist/Link.js';
import {
  ControlPlaneStatusType,
  ReadyStatus,
  ControlPlaneStatusCondition,
} from '../../lib/api/types/crate/controlPlanes';
import { AnimatedHoverTextButton } from '../Helper/AnimatedHoverTextButton';
import { useTranslation } from 'react-i18next';
import { useLink } from '../../lib/shared/useLink.ts';
import type { Ui5CustomEvent } from '@ui5/webcomponents-react-base';
import styles from './MCPHealthPopoverButton.module.css';
import { ConditionsMessageListView } from './ConditionsMessageListView';

type MCPHealthPopoverButtonProps = {
  mcpStatus: ControlPlaneStatusType | undefined;
  projectName: string;
  workspaceName: string;
  mcpName: string;
  large?: boolean;
};

const MCPHealthPopoverButton = ({
  mcpStatus,
  projectName,
  workspaceName,
  mcpName,
  large = false,
}: MCPHealthPopoverButtonProps) => {
  const popoverRef = useRef<PopoverDomRef>(null);
  const buttonRef = useRef<ButtonDomRef>(null);
  const [open, setOpen] = useState(false);
  const { githubIssuesSupportTicket } = useLink();
  const { t } = useTranslation();

  const handleOpenerClick = (
    event: Ui5CustomEvent<ButtonDomRef, ButtonClickEventDetail> | Ui5CustomEvent<LinkDomRef, LinkClickEventDetail>,
  ) => {
    if (popoverRef.current) {
      // Prefer explicit button ref as opener (works reliably); fall back to event.target
      (popoverRef.current as unknown as { opener: EventTarget | null }).opener = buttonRef.current ?? event.target;
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

  return (
    <div className="component-title-row">
      <AnimatedHoverTextButton
        ref={buttonRef}
        icon={getIconForOverallStatus(mcpStatus?.status)}
        text={mcpStatus?.status ?? ''}
        large={large}
        onClick={handleOpenerClick}
      />
      <ResponsivePopover
        placement={PopoverPlacement.Top}
        footer={
          <FlexBox justifyContent={FlexBoxJustifyContent.End} className={styles.footer}>
            <a href={constructGithubIssuesLink()} target="_blank" rel="noreferrer">
              <Button icon="action">{t('MCPHealthPopoverButton.createSupportTicketButton')}</Button>
            </a>
          </FlexBox>
        }
        ref={popoverRef}
        onClose={() => setOpen(false)}
        open={open}
      >
        <ConditionsMessageListView conditions={mcpStatus?.conditions} />
      </ResponsivePopover>
    </div>
  );
};

export default MCPHealthPopoverButton;

const getIconForOverallStatus = (status: ReadyStatus | undefined): JSX.Element => {
  switch (status) {
    case ReadyStatus.Ready:
      return <Icon className={styles.iconReady} name="sap-icon://sys-enter" />;
    case ReadyStatus.NotReady:
      return <Icon className={styles.iconNotReady} name="sap-icon://pending" />;
    case ReadyStatus.InDeletion:
      return <Icon className={styles.iconInDeletion} name="sap-icon://delete" />;
    default:
      return <></>;
  }
};
