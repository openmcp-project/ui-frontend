import { BusyIndicator } from '@ui5/webcomponents-react';
import { useProjectMembers as _useProjectMembers } from '../../spaces/onboarding/hooks/useProjectMembers';
import { MembersAvatarView } from '../ControlPlanes/List/MembersAvatarView';
import { FadeIn } from '../Ui/FadeIn/FadeIn';

interface Props {
  projectName: string;
  useProjectMembers?: typeof _useProjectMembers;
}

export function ProjectMembersCell({ projectName, useProjectMembers = _useProjectMembers }: Props) {
  const { members, isLoading } = useProjectMembers(projectName);

  if (isLoading) {
    return <BusyIndicator active delay={0} size="S" />;
  }

  return (
    <FadeIn>
      <MembersAvatarView members={members} project={projectName} hideNamespaceColumn />
    </FadeIn>
  );
}
