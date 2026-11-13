/**
 * Per-service lifecycle state derived from a V2 service resource's `status`.
 *
 * Vocabulary mirrors the openmcp control-plane lifecycle (see the opencontrolplane-headlamp-plugin
 * `resolveTimeline`/`InstancePhase`): every phase before `Ready` (`Requested` / `Initializing` /
 * `Progressing`, …) counts as in-progress (`installing`), `Terminating` means the service is being
 * deleted, and `Ready` is settled. A settled, installed service frequently reports no phase at all
 * (the controller only populates `status.phase` while reconciling), so a null/empty phase is treated
 * as `ready` rather than `unknown`. Only an unrecognized *non-empty* phase falls back to `unknown`.
 *
 * `error` is special: a service can sit at `phase: Progressing` while a failing `Ready` condition
 * already reports a hard, user-actionable error (e.g. a requested version that is not available).
 * That error takes priority over the phase, because the install will never complete until the user
 * fixes it — so `getServiceLifecycle` treats a non-empty error message as `error` regardless of phase.
 *
 * The ServiceIcon component turns each state into an animation or a corner badge on the icon itself,
 * so there is no icon-name mapping here.
 */
export type ServiceLifecycle = 'installing' | 'deleting' | 'ready' | 'error' | 'unknown';

const READY_PHASE = 'Ready';
const PROGRESSING_PHASE = 'Progressing';
const TERMINATING_PHASE = 'Terminating';

export function getServiceLifecycle(phase?: string | null, errorMessage?: string | null): ServiceLifecycle {
  // A hard reconcile error is user-actionable and overrides the phase-driven state: the service
  // is stuck (often still reporting `Progressing`) until the user fixes the underlying problem.
  if (errorMessage != null && errorMessage !== '') return 'error';
  // A settled, installed service often carries no phase; treat that as ready.
  if (phase == null || phase === '') return 'ready';
  if (phase === READY_PHASE) return 'ready';
  if (phase === TERMINATING_PHASE) return 'deleting';
  if (phase === PROGRESSING_PHASE) return 'installing';
  return 'unknown';
}
