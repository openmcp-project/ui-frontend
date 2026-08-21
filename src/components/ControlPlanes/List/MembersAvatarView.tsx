import { Avatar, AvatarGroup, ResponsivePopover } from '@ui5/webcomponents-react';
import AvatarGroupType from '@ui5/webcomponents/dist/types/AvatarGroupType.js';
import PopoverPlacement from '@ui5/webcomponents/dist/types/PopoverPlacement.js';
import { useId, useMemo, useState } from 'react';
import { Member } from '../../../lib/api/types/shared/members';
import type { TelemetryFeature } from '../../../lib/telemetry/features.ts';
import { useTelemetry } from '../../../lib/telemetry/telemetry.ts';
import { avatarColorSchemeForEmail, generateInitialsForEmail } from '../../Helper/generateInitialsForEmail.ts';
import { MemberTable } from '../../Members/MemberTable.tsx';
import styles from './MembersAvatarView.module.css';

type MembersViewedSource = Extract<TelemetryFeature, { name: 'members.viewed' }>['source'];

interface Props {
  members: Member[];
  hideNamespaceColumn?: boolean;
  source: MembersViewedSource;
  maxWidth?: string;
}

export function MembersAvatarView({ members, hideNamespaceColumn = false, source, maxWidth = '200px' }: Props) {
  const openerId = useId();
  const [popoverIsOpen, setPopoverIsOpen] = useState(false);
  const telemetry = useTelemetry();

  const dedupedAvatarMembers = useMemo(() => {
    const seen = new Set<string>();
    return members.filter((member) => {
      const k = `${member.name}-${member.namespace ?? ''}-${member.provider ?? ''}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [members]);

  if (dedupedAvatarMembers.length === 0) return null;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center' }}>
      <AvatarGroup
        id={openerId}
        style={{ maxWidth }}
        type={AvatarGroupType.Group}
        onClick={() => {
          if (!popoverIsOpen) {
            telemetry.track({ name: 'members.viewed', source });
            setPopoverIsOpen(true);
          }
        }}
      >
        {dedupedAvatarMembers.map((member) => (
          <Avatar
            key={`${member.name}-${member.namespace ?? ''}-${member.provider ?? ''}`}
            colorScheme={avatarColorSchemeForEmail(member.name)}
            initials={generateInitialsForEmail(member.name)}
            accessibleName={member.name}
            size="XS"
          />
        ))}
      </AvatarGroup>
      <ResponsivePopover
        opener={openerId}
        open={popoverIsOpen}
        placement={PopoverPlacement.Bottom}
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
