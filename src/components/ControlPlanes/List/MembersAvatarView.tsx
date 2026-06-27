import { ResponsivePopover } from '@ui5/webcomponents-react';
import { useId, useState } from 'react';
import { MemberTable } from '../../Members/MemberTable.tsx';
import { Member } from '../../../lib/api/types/shared/members';
import { generateInitialsForEmail, avatarColorsForEmail } from '../../Helper/generateInitialsForEmail.ts';
import styles from './MembersAvatarView.module.css';

const MAX_VISIBLE = 5;

interface Props {
  project?: string;
  workspace?: string;
  members: Member[];
  hideNamespaceColumn?: boolean;
}

export function MembersAvatarView({ members, project, workspace, hideNamespaceColumn = false }: Props) {
  const openerId = useId();
  const [popoverIsOpen, setPopoverIsOpen] = useState(false);

  if (members.length === 0) return null;

  const visible = members.slice(0, MAX_VISIBLE);
  const overflow = members.length - MAX_VISIBLE;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center' }}>
      <div
        id={openerId}
        className={styles.stack}
        role="button"
        tabIndex={0}
        aria-label={`${members.length} members`}
        onClick={() => setPopoverIsOpen((v) => !v)}
        onKeyDown={(e) => e.key === 'Enter' && setPopoverIsOpen((v) => !v)}
      >
        {visible.map((member) => {
          const { background, color } = avatarColorsForEmail(member.name);
          return (
            <div
              key={`${project}-${workspace}-${member.name}`}
              className={styles.avatar}
              style={{ background, color }}
              title={member.name}
            >
              {generateInitialsForEmail(member.name)}
            </div>
          );
        })}
        {overflow > 0 && <div className={`${styles.avatar} ${styles.overflow}`}>+{overflow}</div>}
      </div>
      <ResponsivePopover opener={openerId} open={popoverIsOpen} onClose={() => setPopoverIsOpen(false)}>
        <MemberTable members={members} requireAtLeastOneMember={false} hideNamespaceColumn={hideNamespaceColumn} />
      </ResponsivePopover>
    </div>
  );
}
