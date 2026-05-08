import { Button } from '@ui5/webcomponents-react';

import { useTranslation } from 'react-i18next';
import { useNavigate as _useNavigate } from 'react-router-dom';

import { useApiResource as _useApiResource } from '../../../lib/api/useApiResource.ts';
import { useAnalyticsOptional } from '../../../lib/analytics';

interface ConnectButtonProps {
  projectName: string;
  workspaceName: string;
  controlPlaneName: string;
  useNavigate?: typeof _useNavigate;
}

export default function ConnectButtonV2({
  useNavigate = _useNavigate,
  controlPlaneName,
  projectName,
  workspaceName,
}: ConnectButtonProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const analytics = useAnalyticsOptional();

  const handleConnect = () => {
    analytics?.trackEvent('Connect to MCP V2', {
      controlPlane: controlPlaneName,
      workspace: workspaceName,
      project: projectName,
      version: 'v2',
    });
    navigate(`/mcp/projects/${projectName}/workspaces/${workspaceName}/mcpsv2/${controlPlaneName}`);
  };

  return (
    <Button endIcon="navigation-right-arrow" onClick={handleConnect}>
      {t('ConnectButton.buttonText')}
    </Button>
  );
}
