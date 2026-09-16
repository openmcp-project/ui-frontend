/**
 * Per-service lifecycle state derived from a V2 service resource's `status.phase`.
 *
 * Vocabulary mirrors the openmcp control-plane lifecycle (see the opencontrolplane-headlamp-plugin
 * `resolveTimeline`/`InstancePhase`): every phase before `Ready` (`Requested` / `Initializing` /
 * `Progressing`, …) counts as in-progress, and `Terminating` means the service is being deleted.
 * `Ready`, an unknown/empty phase → no indicator (returns `null`).
 */
export type ServiceLifecycle = 'installing' | 'deleting';

const READY_PHASE = 'Ready';
const TERMINATING_PHASE = 'Terminating';

export function getServiceLifecycle(phase?: string | null): ServiceLifecycle | null {
  if (!phase || phase === READY_PHASE) return null;
  if (phase === TERMINATING_PHASE) return 'deleting';
  return 'installing';
}

/** Static UI5 icon name per lifecycle state — matches the icons used by ComponentCardV2. */
export const SERVICE_LIFECYCLE_ICON: Record<ServiceLifecycle, string> = {
  installing: 'synchronize',
  deleting: 'delete',
};
