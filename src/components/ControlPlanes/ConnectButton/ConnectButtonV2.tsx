import { Button } from '@ui5/webcomponents-react';

import { useTranslation } from 'react-i18next';
import { useNavigate as _useNavigate } from 'react-router-dom';

import { useApiResource as _useApiResource } from '../../../lib/api/useApiResource.ts';

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

export default function ConnectButtonV2({
  useNavigate = _useNavigate,
  controlPlaneName,
  projectName,
  workspaceName,
}: ConnectButtonProps) {
  const navigate = useNavigate();

  const { t } = useTranslation();

  return (
    <Button
      endIcon="navigation-right-arrow"
      onClick={() => navigate(`projects/${projectName}/workspaces/${workspaceName}/mcpsv2/${controlPlaneName}`)}
    >
      {t('ConnectButton.buttonText')}
    </Button>
  );
}
