import { Button, Menu, MenuItem, MenuSeparator } from '@ui5/webcomponents-react';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate as _useNavigate } from 'react-router-dom';
import { buildConnectOptionsV2 } from './buildConnectOptionsV2.ts';
import type { ConnectOption } from './useConnectOptions.ts';
import type { ControlPlaneStatus } from '../../../spaces/onboarding/types/ControlPlane.ts';
import { useTelemetry as _useTelemetry } from '../../../lib/telemetry/telemetry.ts';

interface ConnectButtonProps {
  projectName: string;
  workspaceName: string;
  controlPlaneName: string;
  access: ControlPlaneStatus['access'] | undefined;
  disabled?: boolean;
  loading?: boolean;
  useNavigate?: typeof _useNavigate;
  useTelemetry?: typeof _useTelemetry;
}

export default function ConnectButtonV2({
  projectName,
  workspaceName,
  controlPlaneName,
  access,
  disabled,
  loading,
  useNavigate = _useNavigate,
  useTelemetry = _useTelemetry,
}: ConnectButtonProps) {
  const navigate = useNavigate();
  const buttonId = useId();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t } = useTranslation();
  const telemetry = useTelemetry();

  const connectionTargets = buildConnectOptionsV2(access, projectName, workspaceName, controlPlaneName);

  const connectTo = (target: ConnectOption) => {
    telemetry.track({ category: 'controlplane', action: 'connected', idp: target.isSystemIdP ? 'system' : 'custom' });
    navigate(target.url);
  };

  const handleMenuAction = (event: CustomEvent) => {
    const { target } = event.detail.item.dataset;
    if (!target) return;

    const selected = connectionTargets.find((option) => option.url === target);
    if (!selected) return;

    connectTo(selected);
    setIsMenuOpen(false);
  };

  const isMultiTarget = connectionTargets.length > 1;
  const directTarget = connectionTargets.length === 1 ? connectionTargets[0] : undefined;
  const hasTargets = connectionTargets.length > 0;

  const handleClick = isMultiTarget
    ? () => setIsMenuOpen((prev) => !prev)
    : directTarget
      ? () => connectTo(directTarget)
      : undefined;

  return (
    <>
      <Button
        data-testid="connect-button"
        design="Emphasized"
        id={isMultiTarget ? buttonId : undefined}
        endIcon={isMultiTarget ? 'slim-arrow-down' : 'navigation-right-arrow'}
        disabled={!hasTargets || !!disabled}
        loading={loading}
        title={!hasTargets && !loading ? t('ConnectButton.noAccessTitle') : undefined}
        onClick={handleClick}
      >
        {t('ConnectButton.buttonText')}
      </Button>
      {isMultiTarget && (
        <Menu opener={buttonId} open={isMenuOpen} onItemClick={handleMenuAction} onClose={() => setIsMenuOpen(false)}>
          {connectionTargets
            .filter((target) => target.isSystemIdP)
            .map((target) => (
              <MenuItem
                key={target.name}
                text={target.user}
                data-target={target.url}
                additionalText={t('ConnectButton.defaultIdP')}
              />
            ))}
          {connectionTargets.some((target) => target.isSystemIdP) &&
            connectionTargets.some((target) => !target.isSystemIdP) && <MenuSeparator />}
          {connectionTargets
            .filter((target) => !target.isSystemIdP)
            .map((target) => (
              <MenuItem
                key={target.name}
                text={target.user}
                data-target={target.url}
                additionalText={t('ConnectButton.customIdP')}
              />
            ))}
        </Menu>
      )}
    </>
  );
}
