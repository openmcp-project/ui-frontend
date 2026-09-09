import { Button, Menu, MenuItem, MenuSeparator } from '@ui5/webcomponents-react';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate as _useNavigate } from 'react-router-dom';
import { useLazyQuery } from '@apollo/client/react';
import { buildConnectOptions, type ConnectOption } from './buildConnectOptions.ts';
import { GET_KUBECONFIG_QUERY, decodeKubeconfigYaml } from '../../../spaces/onboarding/hooks/useKubeconfigQuery.ts';
import { useTelemetry as _useTelemetry } from '../../../lib/telemetry/telemetry.ts';
import { useToast } from '../../../context/ToastContext.tsx';

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [connectionTargets, setConnectionTargets] = useState<ConnectOption[]>([]);
  const { t } = useTranslation();
  const telemetry = useTelemetry();
  const toast = useToast();

  const [fetchKubeconfig, { loading }] = useLazyQuery(GET_KUBECONFIG_QUERY);

  const connectTo = (target: ConnectOption) => {
    telemetry.track({ category: 'controlplane', action: 'connected', idp: target.isSystemIdP ? 'system' : 'custom' });
    navigate(target.url);
  };

  const handleClick = () => {
    if (connectionTargets.length === 1) {
      connectTo(connectionTargets[0]);
      return;
    }
    if (connectionTargets.length > 1) {
      setIsMenuOpen((prev) => !prev);
      return;
    }
    void fetchKubeconfig({ variables: { kubeConfigName: secretName, namespaceName: namespace } }).then((result) => {
      if (!result.data) return;
      const kubeconfigYaml = decodeKubeconfigYaml(result.data.v1?.Secret?.data, secretKey);
      const targets = buildConnectOptions(kubeconfigYaml, projectName, workspaceName, controlPlaneName);

      if (targets.length === 0) {
        toast.show(t('ConnectButton.noContextsError'));
      } else if (targets.length === 1) {
        setConnectionTargets(targets);
        connectTo(targets[0]);
      } else {
        setConnectionTargets(targets);
        setIsMenuOpen(true);
      }
    });
  };

  const handleMenuAction = (event: CustomEvent) => {
    const { target } = event.detail.item.dataset;
    if (!target) return;
    const selected = connectionTargets.find((option) => option.url === target);
    if (!selected) return;
    connectTo(selected);
    setIsMenuOpen(false);
  };

  const isDisabled = disabled || !secretKey || !secretName || !namespace;

  return (
    <div>
      <Button
        data-testid="connect-button"
        design="Emphasized"
        id={buttonId}
        endIcon={connectionTargets.length > 1 ? 'slim-arrow-down' : 'navigation-right-arrow'}
        disabled={isDisabled}
        loading={loading}
        onClick={handleClick}
      >
        {t('ConnectButton.buttonText')}
      </Button>
      {connectionTargets.length > 1 && (
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
          {connectionTargets.some((target) => !target.isSystemIdP) && <MenuSeparator />}
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
    </div>
  );
}
