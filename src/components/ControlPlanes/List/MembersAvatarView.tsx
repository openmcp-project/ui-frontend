import { Avatar, AvatarGroup, Popover } from '@ui5/webcomponents-react';
import AvatarGroupType from '@ui5/webcomponents/dist/types/AvatarGroupType.js';
import PopoverPlacement from '@ui5/webcomponents/dist/types/PopoverPlacement.js';
import { useId, useState } from 'react';
import { Member } from '../../../lib/api/types/shared/members';
import type { TelemetryFeature } from '../../../lib/telemetry/features.ts';
import { useTelemetry } from '../../../lib/telemetry/telemetry.ts';
import { avatarColorSchemeForEmail, generateInitialsForEmail } from '../../Helper/generateInitialsForEmail.ts';
import { MemberTable } from '../../Members/MemberTable.tsx';

type MembersViewedSource = Extract<TelemetryFeature, { name: 'members.viewed' }>['source'];

interface Props {
  project?: string;
  workspace?: string;
  members: Member[];
  hideNamespaceColumn?: boolean;
  source: MembersViewedSource;
  maxWidth?: string;
}

export function MembersAvatarView({
  members,
  project,
  workspace,
  hideNamespaceColumn = false,
  source,
  maxWidth = '200px',
}: Props) {
  const openerId = useId();
  const [popoverIsOpen, setPopoverIsOpen] = useState(false);
  const telemetry = useTelemetry();

  if (members.length === 0) return null;

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
        {members.map((member) => (
          <Avatar
            key={`${project}-${workspace}-${member.name}`}
            colorScheme={avatarColorSchemeForEmail(member.name)}
            initials={generateInitialsForEmail(member.name)}
            accessibleName={member.name}
            size="XS"
          />
        ))}
      </AvatarGroup>
      <Popover
        opener={openerId}
        open={popoverIsOpen}
        placement={PopoverPlacement.Bottom}
        onClose={() => setPopoverIsOpen(false)}
      >
        <MemberTable members={members} requireAtLeastOneMember={false} hideNamespaceColumn={hideNamespaceColumn} />
      </Popover>
    </div>
  );
}
