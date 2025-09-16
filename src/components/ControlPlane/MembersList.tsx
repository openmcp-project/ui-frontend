import { AnalyticalTableColumnDefinition, FlexBox, Title } from '@ui5/webcomponents-react';
import { useTranslation } from 'react-i18next';

import { MemberTable } from '../Members/MemberTable.tsx';
import { Member } from '../../lib/api/types/shared/members.ts';

export default function MembersList({members}: {members: any[] | undefined}) {
  const { t } = useTranslation();

  const translatedMembers: Member[] = members?.map((member) => ({
    name: member.subjects?.[0]?.name,
    kind: member.subjects?.[0]?.kind || 'Unknown',
    roles: member.role || [],
    namespace: member.namespace,
  })) || [];


  return (
    <>
      <div className="crossplane-table-element">
        <FlexBox justifyContent={'Start'} alignItems={'Center'} gap={'0.5em'}>
          <Title level="H4">{t('common.members')}</Title>
          <br />
        </FlexBox>
        <MemberTable members={translatedMembers} requireAtLeastOneMember={false} />
      </div>
    </>
  );
}

