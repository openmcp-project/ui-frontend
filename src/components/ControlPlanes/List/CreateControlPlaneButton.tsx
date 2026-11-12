import '@ui5/webcomponents-icons/dist/add';
import { Button } from '@ui5/webcomponents-react';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from '../../../hooks/useMediaQuery.ts';

interface Props {
  disabled?: boolean;
  onCreate: () => void;
}

export function CreateControlPlaneButton({ disabled = false, onCreate }: Props) {
  const { t } = useTranslation();
  const compact = useMediaQuery('(max-width: 1024px)');

  return (
    <Button
      data-testid="create-control-plane-button"
      design="Emphasized"
      disabled={disabled}
      icon="add"
      tooltip={compact ? t('ControlPlaneListToolbar.createControlPlane') : undefined}
      onClick={onCreate}
    >
      {compact ? undefined : t('ControlPlaneListToolbar.createControlPlane')}
    </Button>
  );
}
