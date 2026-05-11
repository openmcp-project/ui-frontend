import { Button, Menu, MenuItem } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/delete';
import { Dispatch, FC, SetStateAction, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAnalyticsOptional } from '../../../lib/analytics';

type ControlPlaneCardMenuV2Props = {
  setDialogDeleteMcpIsOpen: Dispatch<SetStateAction<boolean>>;
  isDeleteMcpButtonDisabled: boolean;
};

export const ControlPlaneCardMenuV2: FC<ControlPlaneCardMenuV2Props> = ({
  setDialogDeleteMcpIsOpen,
  isDeleteMcpButtonDisabled,
}) => {
  const openerId = useId();
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const { t } = useTranslation();
  const analytics = useAnalyticsOptional();

  return (
    <>
      <Button
        id={openerId}
        icon="overflow"
        icon-end
        data-testid="ControlPlaneCardMenuV2-opener"
        onClick={() => setMenuIsOpen(true)}
      />
      <Menu
        open={menuIsOpen}
        opener={openerId}
        onItemClick={(event) => {
          if ((event.detail.item as HTMLElement).dataset.action === 'deleteMcp') {
            analytics?.trackEvent('MCP V2 Delete Button Clicked', {
              source: 'control_plane_card_v2',
            });
            setDialogDeleteMcpIsOpen(true);
          }
          setMenuIsOpen(false);
        }}
        onClose={() => setMenuIsOpen(false)}
      >
        <MenuItem
          text={t('ControlPlaneCard.deleteMCP')}
          data-action="deleteMcp"
          icon="delete"
          disabled={isDeleteMcpButtonDisabled}
        />
      </Menu>
    </>
  );
};
