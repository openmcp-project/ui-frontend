/**
 * Builds a download/display filename from a resource's kind and name, e.g. `Crossplane_my-cp`.
 * Omits the `_` separator (and falls back to whichever part is present) when either part is
 * missing, so a resource without a name never gets a stray leading/trailing underscore.
 */
export function buildYamlFilename(kind: string | undefined, name: string | undefined): string {
  return [kind, name].filter(Boolean).join('_');
}
