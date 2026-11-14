import { Button, Menu, MenuItem, MenuSeparator } from '@ui5/webcomponents-react';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate as _useNavigate } from 'react-router-dom';
import { buildConnectOptionsV2 } from './buildConnectOptionsV2.ts';
import type { ConnectOption } from './buildConnectOptions.ts';
import type { ControlPlaneStatus } from '../../../spaces/onboarding/types/ControlPlane.ts';
import { useTelemetry as _useTelemetry } from '../../../lib/telemetry/telemetry.ts';
import { downstreamAccessKey, isDenied as _isDenied } from '../../../lib/api/access/downstreamAccessStore.ts';

interface ConnectButtonProps {
  projectName: string;
  workspaceName: string;
  controlPlaneName: string;
  access: ControlPlaneStatus['access'] | undefined;
  disabled?: boolean;
  loading?: boolean;
  useNavigate?: typeof _useNavigate;
  useTelemetry?: typeof _useTelemetry;
  isDenied?: typeof _isDenied;
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
  isDenied = _isDenied,
}: ConnectButtonProps) {
  const navigate = useNavigate();
  const buttonId = useId();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t } = useTranslation();
  const telemetry = useTelemetry();

  const connectionTargets = buildConnectOptionsV2(access, projectName, workspaceName, controlPlaneName);

  // Access is per IdP. A remembered deny (written after a previous connect that hit a 403)
  // disables only that option — never the others.
  const deniedForTarget = (target: ConnectOption): boolean =>
    isDenied(
      downstreamAccessKey({
        project: projectName,
        workspace: workspaceName,
        controlPlane: controlPlaneName,
        idp: target.isSystemIdP ? undefined : target.user,
      }),
    );

  const connectTo = (target: ConnectOption) => {
    telemetry.track({ category: 'controlplane', action: 'connected', idp: target.isSystemIdP ? 'system' : 'custom' });
    navigate(target.url);
  };

  const handleMenuAction = (event: CustomEvent) => {
    const { target } = event.detail.item.dataset;
    if (!target) return;

    const selected = connectionTargets.find((option) => option.url === target);
    if (!selected || deniedForTarget(selected)) return;

    connectTo(selected);
    setIsMenuOpen(false);
  };

  const isMultiTarget = connectionTargets.length > 1;
  const directTarget = connectionTargets.length === 1 ? connectionTargets[0] : undefined;
  const hasTargets = connectionTargets.length > 0;
  const allDenied = hasTargets && connectionTargets.every(deniedForTarget);

  const handleClick = isMultiTarget
    ? () => setIsMenuOpen((prev) => !prev)
    : directTarget
      ? () => (deniedForTarget(directTarget) ? undefined : connectTo(directTarget))
      : undefined;

  const title =
    !hasTargets && !loading
      ? t('ConnectButton.noConnectionTitle')
      : allDenied
        ? t('ConnectButton.noAccessTitle')
        : undefined;

  const systemTargets = connectionTargets.filter((target) => target.isSystemIdP);
  const customTargets = connectionTargets.filter((target) => !target.isSystemIdP);

  const renderMenuItem = (target: ConnectOption, idpLabel: string) => {
    const denied = deniedForTarget(target);
    return (
      <MenuItem
        key={target.name}
        text={target.user}
        data-target={target.url}
        disabled={denied || undefined}
        additionalText={denied ? t('access.noAccessTooltip') : idpLabel}
      />
    );
  };

  return (
    <>
      <Button
        data-testid="connect-button"
        design="Emphasized"
        id={isMultiTarget ? buttonId : undefined}
        endIcon={isMultiTarget ? 'slim-arrow-down' : 'navigation-right-arrow'}
        disabled={!hasTargets || allDenied || !!disabled}
        loading={loading}
        title={title}
        onClick={handleClick}
      >
        {t('ConnectButton.buttonText')}
      </Button>
      {isMultiTarget && (
        <Menu opener={buttonId} open={isMenuOpen} onItemClick={handleMenuAction} onClose={() => setIsMenuOpen(false)}>
          {systemTargets.map((target) => renderMenuItem(target, t('ConnectButton.defaultIdP')))}
          {systemTargets.length > 0 && customTargets.length > 0 && <MenuSeparator />}
          {customTargets.map((target) => renderMenuItem(target, t('ConnectButton.customIdP')))}
        </Menu>
      )}
    </>
  );
}
