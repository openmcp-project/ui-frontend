import { Avatar, AvatarGroup, Bar, Button, ResponsivePopover, Title } from '@ui5/webcomponents-react';
import AvatarGroupType from '@ui5/webcomponents/dist/types/AvatarGroupType.js';
import PopoverPlacement from '@ui5/webcomponents/dist/types/PopoverPlacement.js';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MemberTable } from '../../Members/MemberTable.tsx';
import { Member } from '../../../lib/api/types/shared/members';
import { generateInitialsForEmail } from '../../Helper/generateInitialsForEmail.ts';

interface Props {
  project?: string;
  workspace?: string;
  members: Member[];
  hideNamespaceColumn?: boolean;
  onEdit?: () => void;
}

export function MembersAvatarView({ members, project, workspace, hideNamespaceColumn = false, onEdit }: Props) {
  const openerId = useId();
  const [popoverIsOpen, setPopoverIsOpen] = useState(false);
  const { t } = useTranslation();
  const avatars = [];

  for (const member of members) {
    avatars.push(
      <Avatar
        key={`project-${project}-ws-${workspace}-${member.name}`}
        initials={generateInitialsForEmail(member.name)}
        size="XS"
      />,
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <AvatarGroup
        id={openerId}
        style={{ maxWidth: '200px' }}
        type={AvatarGroupType.Group}
        onClick={() => setPopoverIsOpen(true)}
      >
        {avatars}
      </AvatarGroup>
      <ResponsivePopover
        opener={openerId}
        placement={PopoverPlacement.Bottom}
        open={popoverIsOpen}
        style={{ width: '600px' }}
        header={
          <Bar
            startContent={<Title level="H5">{t('MembersAvatarView.title')}</Title>}
            endContent={
              onEdit ? (
                <Button
                  icon="edit"
                  design="Emphasized"
                  onClick={() => {
                    setPopoverIsOpen(false);
                    onEdit();
                  }}
                >
                  {t('MembersAvatarView.editButton')}
                </Button>
              ) : undefined
            }
          />
        }
        onClose={() => setPopoverIsOpen(false)}
      >
        <div style={{ padding: '0.75rem' }}>
          <MemberTable members={members} requireAtLeastOneMember={false} hideNamespaceColumn={hideNamespaceColumn} />
        </div>
      </ResponsivePopover>
    </div>
  );
}
