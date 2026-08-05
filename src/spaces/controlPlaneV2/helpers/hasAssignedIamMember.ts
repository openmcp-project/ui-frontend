import { Member } from '../../../lib/api/types/shared/members.ts';
import { ExtraProviderMetadata } from '../../mcp/schemas/mcpV2Input.schema.ts';

// A member only lands in the submitted roleBindings if its provider is enabled/exists.
export function hasAssignedIamMember(
  members: Member[],
  extraProviders: ExtraProviderMetadata[],
  isDefaultProviderEnabled: boolean,
): boolean {
  const hasDefaultMember = isDefaultProviderEnabled && members.some((m) => !m.provider);
  const hasExtraProviderMember = extraProviders.some((p) => members.some((m) => m.provider === p.name));
  return hasDefaultMember || hasExtraProviderMember;
}
