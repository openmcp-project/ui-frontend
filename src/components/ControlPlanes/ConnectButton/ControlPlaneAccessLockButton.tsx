import '@ui5/webcomponents-icons/dist/locked.js';
import '@ui5/webcomponents-icons/dist/email.js';
import '@ui5/webcomponents-icons/dist/add-employee.js';
import { Button, Popover } from '@ui5/webcomponents-react';
import PopoverPlacement from '@ui5/webcomponents/dist/types/PopoverPlacement.js';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  projectName: string;
  workspaceName: string;
  controlPlaneName: string;
  /** Recipients of the access-request mail (workspace admins, falling back to the creator). */
  adminEmails: string[];
  /** When the current user is a workspace admin they can grant access directly. */
  isWorkspaceAdmin: boolean;
  /** Opens the control-plane edit wizard (where roleBindings/members are managed). */
  onGrantAccess: () => void;
}

/**
 * Non-primary "No access" button shown when the current user is not a member of the control
 * plane. Renders with a lock icon; clicking opens a popover. A workspace admin gets a
 * **Grant access** action that jumps to the edit wizard; everyone else gets a `mailto:`
 * Request-access action addressed to the workspace admins.
 */
export function ControlPlaneAccessLockButton({
  projectName,
  workspaceName,
  controlPlaneName,
  adminEmails,
  isWorkspaceAdmin,
  onGrantAccess,
}: Props) {
  const { t } = useTranslation();
  const buttonId = useId();
  const [popoverOpen, setPopoverOpen] = useState(false);

  const requestAccessMailtoHref = (() => {
    const subject = encodeURIComponent(
      t('ControlPlaneAccessLock.accessRequestSubject', { controlPlaneName, workspaceName, projectName }),
    );
    const body = encodeURIComponent(
      t('ControlPlaneAccessLock.accessRequestBody', { controlPlaneName, workspaceName, projectName }),
    );
    return `mailto:${adminEmails.join(',')}?subject=${subject}&body=${body}`;
  })();

  const handleGrantAccess = () => {
    setPopoverOpen(false);
    onGrantAccess();
  };

  return (
    <div>
      <Button
        data-testid="connect-button-locked"
        design="Default"
        id={buttonId}
        icon="locked"
        onClick={() => setPopoverOpen((o) => !o)}
      >
        {t('ControlPlaneAccessLock.buttonText')}
      </Button>
      <Popover
        open={popoverOpen}
        opener={buttonId}
        placement={PopoverPlacement.Bottom}
        onClose={() => setPopoverOpen(false)}
      >
        <div style={{ padding: '0.5rem 1rem', maxWidth: '20rem' }}>
          <p>{t('ControlPlaneAccessLock.permissionErrorMessage')}</p>
          {isWorkspaceAdmin ? (
            <>
              <p style={{ color: 'var(--sapContent_LabelColor)', fontSize: '0.875rem' }}>
                {t('ControlPlaneAccessLock.grantAccessSubtitle')}
              </p>
              <Button
                data-testid="grant-access-button"
                design="Emphasized"
                icon="add-employee"
                onClick={handleGrantAccess}
              >
                {t('ControlPlaneAccessLock.grantAccessButton')}
              </Button>
            </>
          ) : (
            <>
              <p style={{ color: 'var(--sapContent_LabelColor)', fontSize: '0.875rem' }}>
                {t('ControlPlaneAccessLock.permissionErrorMessageSubtitle')}
              </p>
              <a href={requestAccessMailtoHref}>
                <Button design="Transparent" icon="email">
                  {t('ControlPlaneAccessLock.askAdminButton')}
                </Button>
              </a>
            </>
          )}
        </div>
      </Popover>
    </div>
  );
}
