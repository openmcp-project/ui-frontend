/**
 * Generates the part of the URL (query string and hash fragments) that must be kept when redirecting the user.
 *
 * @example
 * ```ts
 * // Current URL: https://example.com/?sap-theme=sap_horizon#/mcp/projects
 *
 * const redirectTo = getRedirectSuffix();
 * // redirectTo -> "/?sap-theme=sap_horizon#/mcp/projects"
 * ```
 */
export function getRedirectSuffix() {
  const { search, hash } = globalThis.location;
  return (search ? `/${search}` : '') + hash;
}
