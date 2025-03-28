import { Avatar, AvatarGroup, Popover } from '@ui5/webcomponents-react';
import AvatarGroupType from '@ui5/webcomponents/dist/types/AvatarGroupType.js';
import PopoverPlacement from '@ui5/webcomponents/dist/types/PopoverPlacement.js';
import { useRef, useState } from 'react';
import { MemberTable } from '../../Members/MemberTable.tsx';
import { Member } from '../../../lib/api/types/shared/members';

interface Props {
  project?: string;
  workspace?: string;
  members: Member[];
}

export function MembersAvatarView({ members, project, workspace }: Props) {
  const openerRef = useRef(null);
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
      <AvatarGroup
        ref={openerRef}
        style={{ maxWidth: '200px' }}
        type={AvatarGroupType.Group}
        onClick={handleOnClick}
      >
        {avatars}
      </AvatarGroup>
      <Popover
        opener={openerRef.current!}
        placement={PopoverPlacement.Bottom}
        open={popoverIsOpen}
        onClose={() => {
          setPopoverIsOpen(false);
        }}
      >
        <MemberTable members={members} />
      </Popover>
    </div>
  );
}

export function generateInitialsForEmail(email: string | undefined): string {
  if (!email) {
    return '';
  }
  const [name, _] = email.split('@');
  const nameParts = name.split('.');
  // return the first letter of each part of the name up to 3 characters
  return nameParts
    .map((part) => part[0])
    .join('')
    .substring(0, 3)
    .toUpperCase();
}
