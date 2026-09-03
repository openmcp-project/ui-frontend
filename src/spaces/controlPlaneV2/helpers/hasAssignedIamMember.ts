import { Member } from '../../../lib/api/types/shared/members.ts';
import { ExtraProviderMetadata } from '../../mcp/schemas/mcpV2Input.schema.ts';

export function hasAssignedIamMember(members: Member[], extraProviders: ExtraProviderMetadata[]): boolean {
  const hasDefaultMember = members.some((m) => !m.provider);
  const hasExtraProviderMember = extraProviders.some((p) => members.some((m) => m.provider === p.name));
  return hasDefaultMember || hasExtraProviderMember;
}
