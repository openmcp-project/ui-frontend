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
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const telemetry = useTelemetry();

  const handleClick = () => {
    setIsPopoverOpen(true);
    telemetry.track({ name: 'members.viewed', source });
  };

  const handleClose = () => {
    setIsPopoverOpen(false);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <AvatarGroup id={openerId} style={{ maxWidth }} type={AvatarGroupType.Group} onClick={handleClick}>
        {members.map((member, index) => (
          <Avatar
            key={`project-${project}-ws-${workspace}-${member.kind}-${member.namespace ?? ''}-${member.name}-${index}`}
            initials={generateInitialsForEmail(member.name)}
            size="XS"
          />
        ))}
      </AvatarGroup>
      <Popover opener={openerId} placement={PopoverPlacement.Bottom} open={isPopoverOpen} onClose={handleClose}>
        <MemberTable members={members} requireAtLeastOneMember={false} hideNamespaceColumn={hideNamespaceColumn} />
      </Popover>
    </div>
  );
}
