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
  hideNamespaceColumn?: boolean;
  source: string;
}

const MAX_VISIBLE = 3;

export function MembersAvatarView({ members, project, workspace, hideNamespaceColumn = false }: Props) {
  const openerId = useId();
  const [popoverIsOpen, setPopoverIsOpen] = useState(false);
  const avatars = [];

  const handleOnClick = () => {
    setPopoverIsOpen(true);
  };

  const visibleMembers = members.slice(0, MAX_VISIBLE);
  const overflowCount = members.length - visibleMembers.length;

  for (const member of visibleMembers) {
    avatars.push(
      <Avatar
        key={`project-${project}-ws-${workspace}-${member.name}`}
        initials={generateInitialsForEmail(member.name)}
        size="XS"
      />,
    );
  }

  if (overflowCount > 0) {
    avatars.push(<Avatar key="overflow" initials={`+${overflowCount}`} size="XS" />);
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
      <AvatarGroup id={openerId} type={AvatarGroupType.Group} onClick={handleOnClick}>
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
        <MemberTable members={members} requireAtLeastOneMember={false} hideNamespaceColumn={hideNamespaceColumn} />
      </Popover>
    </div>
  );
}
