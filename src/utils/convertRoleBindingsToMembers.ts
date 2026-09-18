import { Member } from '../lib/api/types/shared/members.ts';
import { MemberRoleBinding } from '../spaces/controlPlaneV2/helpers/flattenOidcRoleBindings.ts';

export function convertRoleBindingsToMembers(roleBindings?: MemberRoleBinding[]): Member[] {
  if (!roleBindings) return [];

  const memberMap = new Map<string, Member>();

  for (const binding of roleBindings) {
    for (const subject of binding.subjects) {
      // Provider is part of the key: same kind+name can differ per identity provider.
      const key = `${binding.provider ?? ''}-${subject.kind}-${subject.name}`;
      if (memberMap.has(key)) {
        const member = memberMap.get(key)!;
        if (!member.roles.includes(binding.role)) {
          member.roles.push(binding.role);
        }
      } else {
        memberMap.set(key, {
          kind: subject.kind,
          name: subject.name,
          roles: [binding.role],
          provider: binding.provider,
        });
      }
    }
  }

  return Array.from(memberMap.values());
}
