// Replaces monaco-worker-manager/worker to fix a deadlock in Monaco 0.55+.
// Without this fix the YAML worker never starts, breaking IntelliSense in the Monaco editor.
//
// The old library expected Monaco to send two messages before calling start(),
// but Monaco 0.55 changed the order: it now sends '-please-ignore-' first, then
// '$initialize'. This caused the worker to hang waiting for a message it already missed.
//
// Fix: call start() on the first Monaco message instead of the second.
// Expected message order (FIFO):
//   #0 — createData     (injected by our main-thread patch before Monaco starts)
//   #1 — '-please-ignore-'  (sent by Monaco's WebWorker constructor)
//   #2 — '$initialize'      (sent by Monaco's WebWorkerClient, handled by start())
// @ts-expect-error internal Monaco ESM path — no .d.ts declaration shipped
import { start } from 'monaco-editor/esm/vs/editor/editor.worker.start.js';

let _createData: unknown = {};
let _fn: ((ctx: unknown, createData: unknown) => unknown) | null = null;

export function initialize(fn: (ctx: unknown, createData: unknown) => unknown): void {
  _fn = fn;

  // Message #0: save createData sent by the main-thread patch
  self.onmessage = (m: MessageEvent<unknown>) => {
    _createData = m.data;

    // Message #1: '-please-ignore-' — call start() so Monaco's WebWorkerServer is ready for #2
    self.onmessage = () => {
      (start as (createClient: (ctx: unknown) => unknown) => void)((ctx) => _fn!(ctx, _createData));
    };
  };
}
