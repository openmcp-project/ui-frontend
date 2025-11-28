import { Member } from '../lib/api/types/shared/members';

export function useConvertRoleBindingsToMembers(
  roleBindings?: { role: string; subjects: { kind: string; name: string }[] }[],
): Member[] {
  if (!roleBindings) return [];

  const memberMap = new Map<string, Member>();

  for (const binding of roleBindings) {
    for (const subject of binding.subjects) {
      const key = `${subject.kind}-${subject.name}`;
      if (memberMap.has(key)) {
        // Add role to existing member
        const member = memberMap.get(key)!;
        if (!member.roles.includes(binding.role)) {
          member.roles.push(binding.role);
        }
      } else {
        // Create new member
        memberMap.set(key, {
          kind: subject.kind,
          name: subject.name,
          roles: [binding.role],
        });
      }
    }
  }

  return Array.from(memberMap.values());
}
