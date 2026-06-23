import { Button, Menu, MenuItem, MenuSeparator } from '@ui5/webcomponents-react';
import { useId, useState } from 'react';
import { DownloadKubeconfig } from '../CopyKubeconfigButton.tsx';
import { useTranslation } from 'react-i18next';
import { useNavigate as _useNavigate } from 'react-router-dom';
import { useConnectOptions, type ConnectOption } from './useConnectOptions.ts';
import { useApiResource as _useApiResource } from '../../../lib/api/useApiResource.ts';
import { GetKubeconfig } from '../../../lib/api/types/crate/getKubeconfig.ts';
import { useTelemetry as _useTelemetry } from '../../../lib/telemetry/telemetry.ts';

interface ConnectButtonProps {
  projectName: string;
  workspaceName: string;
  controlPlaneName: string;
  secretName: string;
  namespace: string;
  secretKey: string;
  disabled?: boolean;
  useApiResource?: typeof _useApiResource;
  useNavigate?: typeof _useNavigate;
  useTelemetry?: typeof _useTelemetry;
}

export default function ConnectButton({
  projectName,
  workspaceName,
  controlPlaneName,
  secretName,
  namespace,
  secretKey,
  disabled,
  useApiResource = _useApiResource,
  useNavigate = _useNavigate,
  useTelemetry = _useTelemetry,
}: ConnectButtonProps) {
  const navigate = useNavigate();
  const buttonId = useId();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t } = useTranslation();
  const telemetry = useTelemetry();

  const {
    data: kubeconfigResource,
    error,
    isLoading,
  } = useApiResource(GetKubeconfig(secretKey, secretName, namespace));

  const connectionTargets = useConnectOptions(kubeconfigResource, projectName, workspaceName, controlPlaneName);

  const connectTo = (target: ConnectOption) => {
    telemetry.track({ name: 'controlplane.connected', idp: target.isSystemIdP ? 'system' : 'custom' });
    navigate(target.url);
  };

  const handleMenuAction = (event: CustomEvent) => {
    const { action, target } = event.detail.item.dataset;

    if (action === 'download') {
      DownloadKubeconfig(kubeconfigResource, controlPlaneName);
      setIsMenuOpen(false);
      return;
    }

    if (target) {
      const selected = connectionTargets.find((option) => option.url === target);
      if (!selected) return;
      connectTo(selected);
      setIsMenuOpen(false);
      return;
    }
  };

  if (isLoading || error || connectionTargets.length === 0) {
    return (
      <Button endIcon="navigation-right-arrow" disabled={true}>
        {t('ConnectButton.buttonText')}
      </Button>
    );
  }

  if (connectionTargets.length === 1) {
    const directTarget = connectionTargets[0];
    return (
      <Button endIcon="navigation-right-arrow" disabled={disabled} onClick={() => connectTo(directTarget)}>
        {t('ConnectButton.buttonText')}
      </Button>
    );
  }

  return (
    <div>
      <Button
        id={buttonId}
        disabled={disabled}
        endIcon="slim-arrow-down"
        onClick={() => setIsMenuOpen((prev) => !prev)}
      >
        {t('ConnectButton.buttonText')}
      </Button>
      <Menu opener={buttonId} open={isMenuOpen} onItemClick={handleMenuAction} onClose={() => setIsMenuOpen(false)}>
        {connectionTargets.map((target) => (
          <MenuItem
            key={target.name}
            text={target.user}
            data-target={target.url}
            additionalText={target.isSystemIdP ? t('ConnectButton.defaultIdP') : undefined}
          />
        ))}
        <MenuSeparator />
        <MenuItem text={t('ConnectButton.downloadKubeconfig')} data-action="download" />
      </Menu>
    </div>
  );
}
