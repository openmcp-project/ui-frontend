import { Button } from '@ui5/webcomponents-react';

import { useTranslation } from 'react-i18next';
import { generatePath, useNavigate as _useNavigate } from 'react-router-dom';

import { Routes } from '../../../Routes.ts';

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

  return (
    <Button
      design="Emphasized"
      endIcon="navigation-right-arrow"
      onClick={() => navigate(generatePath(Routes.McpV2, { projectName, workspaceName, controlPlaneName }))}
    >
      {t('ConnectButton.buttonText')}
    </Button>
  );
}
