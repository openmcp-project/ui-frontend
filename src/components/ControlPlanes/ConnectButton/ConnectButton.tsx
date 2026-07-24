import { Button, Menu, MenuItem, MenuSeparator } from '@ui5/webcomponents-react';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate as _useNavigate } from 'react-router-dom';
import { useLazyQuery } from '@apollo/client/react';
import { buildConnectOptions, type ConnectOption } from './useConnectOptions.ts';
import { useTelemetry as _useTelemetry } from '../../../lib/telemetry/telemetry.ts';
import { GET_KUBECONFIG_QUERY } from '../../../spaces/onboarding/hooks/useKubeconfigQuery.ts';

function decodeKubeconfig(data: Record<string, string> | null | undefined, secretKey: string): string | undefined {
  if (!data || !secretKey) return undefined;
  const base64 = data[secretKey];
  if (!base64) return undefined;
  try {
    return atob(base64);
  } catch {
    return undefined;
  }
}

interface ConnectButtonProps {
  projectName: string;
  workspaceName: string;
  controlPlaneName: string;
  secretName: string;
  namespace: string;
  secretKey: string;
  disabled?: boolean;
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
  useNavigate = _useNavigate,
  useTelemetry = _useTelemetry,
}: ConnectButtonProps) {
  const navigate = useNavigate();
  const buttonId = useId();
  const { t } = useTranslation();
  const telemetry = useTelemetry();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [connectionTargets, setConnectionTargets] = useState<ConnectOption[]>([]);

  const [fetchKubeconfig, { loading }] = useLazyQuery(GET_KUBECONFIG_QUERY);

  const connectTo = (target: ConnectOption) => {
    telemetry.track({ name: 'controlplane.connected', idp: target.isSystemIdP ? 'system' : 'custom' });
    navigate(target.url);
  };

  const handleClick = () => {
    if (connectionTargets.length > 0) {
      setIsMenuOpen((prev) => !prev);
      return;
    }
    fetchKubeconfig({ variables: { kubeConfigName: secretName, namespaceName: namespace } })
      .then(({ data }) => {
        const raw = data?.v1?.Secret?.data as Record<string, string> | null | undefined;
        const yaml = decodeKubeconfig(raw, secretKey);
        const targets = buildConnectOptions(yaml, projectName, workspaceName, controlPlaneName);
        if (targets.length === 1) {
          telemetry.track({ name: 'controlplane.connected', idp: targets[0].isSystemIdP ? 'system' : 'custom' });
          navigate(targets[0].url);
        } else if (targets.length > 1) {
          setConnectionTargets(targets);
          setIsMenuOpen(true);
        }
      })
      .catch(() => {});
  };

  const handleMenuAction = (event: CustomEvent) => {
    const { target } = event.detail.item.dataset;
    if (target) {
      const selected = connectionTargets.find((option) => option.url === target);
      if (!selected) return;
      connectTo(selected);
      setIsMenuOpen(false);
    }
  };

  return (
    <div>
      <Button
        data-testid="connect-button"
        design="Emphasized"
        disabled={disabled || loading}
        endIcon={connectionTargets.length > 1 ? 'slim-arrow-down' : 'navigation-right-arrow'}
        id={buttonId}
        onClick={handleClick}
      >
        {t('ConnectButton.buttonText')}
      </Button>
      {connectionTargets.length > 1 && (
        <Menu opener={buttonId} open={isMenuOpen} onItemClick={handleMenuAction} onClose={() => setIsMenuOpen(false)}>
          {connectionTargets
            .filter((t) => t.isSystemIdP)
            .map((target) => (
              <MenuItem
                key={target.name}
                additionalText={t('ConnectButton.defaultIdP')}
                data-target={target.url}
                text={target.user}
              />
            ))}
          {connectionTargets.some((t) => !t.isSystemIdP) && <MenuSeparator />}
          {connectionTargets
            .filter((t) => !t.isSystemIdP)
            .map((target) => (
              <MenuItem
                key={target.name}
                additionalText={t('ConnectButton.customIdP')}
                data-target={target.url}
                text={target.user}
              />
            ))}
        </Menu>
      )}
    </div>
  );
}
