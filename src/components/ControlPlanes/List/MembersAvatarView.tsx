import { Avatar, AvatarGroup, Popover } from '@ui5/webcomponents-react';
import AvatarGroupType from '@ui5/webcomponents/dist/types/AvatarGroupType.js';
import PopoverPlacement from '@ui5/webcomponents/dist/types/PopoverPlacement.js';
import { useId, useState } from 'react';
import { MemberTable } from '../../Members/MemberTable.tsx';
import { Member } from '../../../lib/api/types/shared/members';
import { generateInitialsForEmail } from '../../Helper/generateInitialsForEmail.ts';

interface Props {
  project?: string;
  workspace?: string;
  members: Member[];
}

export function MembersAvatarView({ members, project, workspace }: Props) {
  const openerId = useId();
  const [popoverIsOpen, setPopoverIsOpen] = useState(false);
  const avatars = [];

  const handleOnClick = () => {
    setPopoverIsOpen(true);
  };

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
      <AvatarGroup id={openerId} style={{ maxWidth: '200px' }} type={AvatarGroupType.Group} onClick={handleOnClick}>
        {avatars}
      </AvatarGroup>
      <Popover
        opener={openerId}
        placement={PopoverPlacement.Bottom}
        open={popoverIsOpen}
        onClose={() => {
          setPopoverIsOpen(false);
        }}
      >
        <MemberTable members={members} requireAtLeastOneMember={false} />
      </Popover>
    </div>
  );
}
