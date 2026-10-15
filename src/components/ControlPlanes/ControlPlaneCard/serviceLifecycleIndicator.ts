/**
 * Per-service lifecycle state derived from a V2 service resource's `status.phase`.
 *
 * Vocabulary mirrors the openmcp control-plane lifecycle (see the opencontrolplane-headlamp-plugin
 * `resolveTimeline`/`InstancePhase`): every phase before `Ready` (`Requested` / `Initializing` /
 * `Progressing`, …) counts as in-progress, `Terminating` means the service is being deleted, and
 * `Ready` shows a positive checkmark. An unknown/empty phase → no indicator (returns `null`).
 */
export type ServiceLifecycle = 'installing' | 'deleting' | 'ready' | 'unknown';

const READY_PHASE = 'Ready';
const PROGRESSING_PHASE = 'Progressing';
const TERMINATING_PHASE = 'Terminating';

export function getServiceLifecycle(phase?: string | null): ServiceLifecycle {
  if (phase == null || phase === '') return 'unknown';
  if (phase === READY_PHASE) return 'ready';
  if (phase === TERMINATING_PHASE) return 'deleting';
  if (phase === PROGRESSING_PHASE) return 'installing';
  return 'unknown';
}

/** Static UI5 icon name per lifecycle state — matches the icons used by ComponentCardV2. */
export const SERVICE_LIFECYCLE_ICON: Record<ServiceLifecycle, string> = {
  installing: 'synchronize',
  deleting: 'delete',
  ready: 'accept',
  unknown: 'question-mark',
};
