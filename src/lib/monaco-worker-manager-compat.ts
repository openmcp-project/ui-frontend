// Compatibility shim that replaces monaco-worker-manager/worker for Monaco 0.55+.
//
// Root cause: monaco-worker-manager calls Monaco's old initialize() from
// vs/common/initialize.js, which waits for a SECOND message before calling start().
// Monaco 0.55's WebWorkerClient sends '-please-ignore-' first, then '$initialize'.
// With the old protocol, '$initialize' is consumed before WebWorkerServer is ready,
// deadlocking the worker (_onModuleLoaded never resolves) and causing a fallback to
// SynchronousWorkerClient(EditorWorker(null)) → "Missing requestHandler or method".
//
// Fix: call start() on the FIRST received message instead of deferring to the second.
// Message ordering we rely on (guaranteed FIFO):
//   #0 — createData  (postMessage'd by the main-thread monkey-patch before Monaco runs)
//   #1 — '-please-ignore-'  (WebWorker constructor, via microtask)
//   #2 — '$initialize'      (WebWorkerClient constructor, via microtask after #1)
//
// On #0 we store createData; on #1 we call start() → WebWorkerServer handles #2
// ('$initialize') and all subsequent $fmr requests.
// @ts-expect-error internal Monaco ESM path — no .d.ts declaration shipped
import { start } from 'monaco-editor/esm/vs/editor/editor.worker.start.js';

let _createData: unknown = {};
let _fn: ((ctx: unknown, createData: unknown) => unknown) | null = null;

export function initialize(fn: (ctx: unknown, createData: unknown) => unknown): void {
  _fn = fn;

  // Message #0: receive createData injected by the main-thread createWebWorker interceptor
  self.onmessage = (m: MessageEvent<unknown>) => {
    _createData = m.data;

    // Message #1: '-please-ignore-' → set up WebWorkerServer with YAML foreign module
    self.onmessage = () => {
      // start() calls webWorkerBootstrap.initialize() which creates WebWorkerServer and
      // sets globalThis.onmessage — from here Monaco's protocol handles everything.
      (start as (createClient: (ctx: unknown) => unknown) => void)((ctx) => _fn!(ctx, _createData));
    };
  };
}
