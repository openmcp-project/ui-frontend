import { Avatar, AvatarGroup, ResponsivePopover } from '@ui5/webcomponents-react';
import AvatarGroupType from '@ui5/webcomponents/dist/types/AvatarGroupType.js';
import PopoverPlacement from '@ui5/webcomponents/dist/types/PopoverPlacement.js';
import { useId, useState } from 'react';
import { MemberTable } from '../../Members/MemberTable.tsx';
import { Member } from '../../../lib/api/types/shared/members';
import { generateInitialsForEmail } from '../../Helper/generateInitialsForEmail.ts';
import styles from './MembersAvatarView.module.css';

interface Props {
  project?: string;
  workspace?: string;
  members: Member[];
  hideNamespaceColumn?: boolean;
}

export function MembersAvatarView({ members, project, workspace, hideNamespaceColumn = false }: Props) {
  const openerId = useId();
  const [popoverIsOpen, setPopoverIsOpen] = useState(false);
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
        className={styles.popover}
        onClose={() => setPopoverIsOpen(false)}
      >
        <div className={styles.content}>
          <MemberTable members={members} requireAtLeastOneMember={false} hideNamespaceColumn={hideNamespaceColumn} />
        </div>
      </ResponsivePopover>
    </div>
  );
}
