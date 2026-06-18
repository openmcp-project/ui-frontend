import { Button, Menu, MenuItem } from '@ui5/webcomponents-react';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate as _useNavigate } from 'react-router-dom';
import { useApiResource as _useApiResource } from '../../../lib/api/useApiResource.ts';
import { GetKubeconfig } from '../../../lib/api/types/crate/getKubeconfig.ts';
import { useConnectOptions } from './useConnectOptions.ts';

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
}: ConnectButtonProps) {
  const navigate = useNavigate();
  const buttonId = useId();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t } = useTranslation();

  const {
    data: kubeconfigResource,
    error,
    isLoading,
  } = useApiResource(GetKubeconfig(secretKey, secretName, namespace));

  const connectionTargets = useConnectOptions(kubeconfigResource, projectName, workspaceName, controlPlaneName);

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
      <Button endIcon="navigation-right-arrow" disabled={disabled} onClick={() => navigate(directTarget.url)}>
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
      <Menu
        opener={buttonId}
        open={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onItemClick={(event) => {
          const { target } = event.detail.item.dataset;
          if (target) navigate(target);
          setIsMenuOpen(false);
        }}
      >
        {connectionTargets.map((target) => (
          <MenuItem
            key={target.name}
            text={target.user}
            data-target={target.url}
            additionalText={target.isSystemIdP ? t('ConnectButton.defaultIdP') : undefined}
          />
        ))}
      </Menu>
    </div>
  );
}
