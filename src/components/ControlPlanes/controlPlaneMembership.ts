import { MCP_V2_DEFAULT_ROLE, Member, MemberKind, MemberRoles } from '../../lib/api/types/shared/members.ts';

/**
 * Drops any IdP prefix from a subject name (e.g. `idpid:someone@sap.com` → `someone@sap.com`),
 * preserving case. Email addresses never contain a colon, so anything up to and including the
 * last `:` is the prefix.
 */
function stripIdpPrefix(value: string): string {
  return value.includes(':') ? value.slice(value.lastIndexOf(':') + 1) : value;
}

/**
 * Normalizes an identity for comparison: IdP prefix stripped and lower-cased.
 *
 * Subject names in roleBindings may carry an identity-provider prefix (e.g.
 * `idpid:someone@sap.com`), while `user.email` is the bare address.
 */
function normalizeIdentity(value: string): string {
  return stripIdpPrefix(value).toLowerCase();
}

/**
 * True when `email` matches a `User`-kind member, ignoring case and any IdP prefix on the
 * member name.
 *
 * Mirrors the workspace-level membership check in ControlPlaneListWorkspaceGridTile:
 * only `kind === User` subjects are considered, so access granted via a Group is not
 * detected here (documented, consistent limitation).
 */
export function isEmailMember(members: Member[], email?: string): boolean {
  if (!email) return false;
  const target = normalizeIdentity(email);
  return members.some((m) => isUserMember(m) && normalizeIdentity(m.name) === target);
}

const ADMIN_ROLES = new Set<string>([MemberRoles.admin, MCP_V2_DEFAULT_ROLE]);

function isUserMember(member: Member): boolean {
  return member.kind.toLowerCase() === MemberKind.User.toLowerCase();
}

function hasAdminRole(member: Member): boolean {
  return member.roles.some((r) => ADMIN_ROLES.has(r));
}

/**
 * True when `email` is a `User`-kind member holding an admin role (`admin` for V1/workspaces,
 * `cluster-admin` for V2), ignoring case and any IdP prefix.
 */
export function isEmailAdmin(members: Member[], email?: string): boolean {
  if (!email) return false;
  const target = normalizeIdentity(email);
  return members.some((m) => isUserMember(m) && normalizeIdentity(m.name) === target && hasAdminRole(m));
}

/**
 * Email addresses to contact for access: `User`-kind members holding an admin role
 * (`admin` for V1/workspaces, `cluster-admin` for V2), falling back to the resource's
 * creator annotation when no admin member is listed.
 */
export function adminMemberEmails(members: Member[], createdBy?: string): string[] {
  const emails = members.filter((m) => isUserMember(m) && hasAdminRole(m)).map((m) => stripIdpPrefix(m.name));

  const unique = Array.from(new Set(emails));
  if (unique.length > 0) return unique;

  return createdBy ? [stripIdpPrefix(createdBy)] : [];
}
