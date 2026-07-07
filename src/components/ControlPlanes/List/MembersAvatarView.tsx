import { Avatar, AvatarGroup, Popover } from '@ui5/webcomponents-react';
import AvatarGroupType from '@ui5/webcomponents/dist/types/AvatarGroupType.js';
import PopoverPlacement from '@ui5/webcomponents/dist/types/PopoverPlacement.js';
import { useId, useState } from 'react';
import { Member } from '../../../lib/api/types/shared/members';
import type { TelemetryFeature } from '../../../lib/telemetry/features.ts';
import { useTelemetry } from '../../../lib/telemetry/telemetry.ts';
import { generateInitialsForEmail } from '../../Helper/generateInitialsForEmail.ts';
import { MemberTable } from '../../Members/MemberTable.tsx';

type MembersViewedSource = Extract<TelemetryFeature, { name: 'members.viewed' }>['source'];

interface Props {
  project?: string;
  workspace?: string;
  members: Member[];
  hideNamespaceColumn?: boolean;
  source: MembersViewedSource;
}

export function MembersAvatarView({ members, project, workspace, hideNamespaceColumn = false, source }: Props) {
  const openerId = useId();
  const [popoverIsOpen, setPopoverIsOpen] = useState(false);
  const telemetry = useTelemetry();
  const avatars = [];

  const handleOnClick = () => {
    setPopoverIsOpen(true);
    telemetry.track({ name: 'members.viewed', source });
  };

  for (const [index, member] of members.entries()) {
    avatars.push(
      <Avatar
        key={`project-${project}-ws-${workspace}-${member.kind}-${member.namespace ?? ''}-${member.name}-${index}`}
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
        <MemberTable members={members} requireAtLeastOneMember={false} hideNamespaceColumn={hideNamespaceColumn} />
      </Popover>
    </div>
  );
}
