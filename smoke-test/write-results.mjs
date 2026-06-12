#!/usr/bin/env node
// Converts the Cypress JSON reporter output (results/report.json) into:
//   results/smoke-result.json  — human-readable summary
//   results/smoke-result.crd.yaml — Kubernetes SmokeTestResult CRD manifest
//
// Usage: node write-results.mjs [--report results/report.json]

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const args = process.argv.slice(2);
const reportArg = args.indexOf('--report');
const reportPath = reportArg !== -1 ? args[reportArg + 1] : 'results/report.json';

let raw;
try {
  raw = JSON.parse(readFileSync(resolve(reportPath), 'utf8'));
} catch (e) {
  console.error(`Could not read ${reportPath}:`, e.message);
  process.exit(1);
}

// ---------- Parse Mocha/Cypress JSON reporter output ----------------------
const stats = raw.stats ?? {};
const suites = raw.results ?? [];

const tests = suites.flatMap((suite) =>
  (suite.tests ?? []).map((t) => ({
    name: t.fullTitle ?? t.title,
    state: t.state ?? (t.err ? 'failed' : 'passed'),
    duration: t.duration ?? 0,
    error: t.err?.message ?? null,
  })),
);

const passed = tests.filter((t) => t.state === 'passed').length;
const failed = tests.filter((t) => t.state === 'failed').length;
const pending = tests.filter((t) => t.state === 'pending').length;
const overall = failed === 0 ? 'success' : 'failure';

const startTime = stats.start ?? new Date().toISOString();
const duration = stats.duration ?? 0;

// ---------- Plain JSON summary --------------------------------------------
const summary = {
  overall,
  startTime,
  durationMs: duration,
  totals: { passed, failed, pending, total: tests.length },
  tests,
};

writeFileSync('results/smoke-result.json', JSON.stringify(summary, null, 2));
console.log('Wrote results/smoke-result.json');

// ---------- Kubernetes SmokeTestResult CRD --------------------------------
// CRD definition lives alongside this tool (smoke-test-crd.yaml).
// The manifest below is an *instance* of that CRD.
const runName = `smoke-${new Date(startTime).toISOString().replace(/[:.]/g, '-').slice(0, 19)}`;
// Use a dedicated namespace to keep results out of app namespaces.
// Override with SMOKE_RESULT_NAMESPACE env var.
const namespace = process.env.SMOKE_RESULT_NAMESPACE ?? 'smoke-tests';

const crd = `apiVersion: openmcp.cloud/v1alpha1
kind: SmokeTestResult
metadata:
  name: ${runName}
  namespace: ${namespace}
  labels:
    app.kubernetes.io/managed-by: openmcp-smoke-test
spec:
  targetUrl: ${process.env.CYPRESS_BASE_URL ?? 'unknown'}
  startTime: "${startTime}"
  durationMs: ${duration}
status:
  overall: ${overall}
  totals:
    passed: ${passed}
    failed: ${failed}
    pending: ${pending}
    total: ${tests.length}
  tests:
${tests
  .map(
    (t) => `  - name: "${t.name.replace(/"/g, '\\"')}"
    state: ${t.state}
    durationMs: ${t.duration}${t.error ? `\n    error: "${t.error.replace(/"/g, '\\"').replace(/\n/g, ' ')}"` : ''}`,
  )
  .join('\n')}
`;

writeFileSync('results/smoke-result.crd.yaml', crd);
console.log('Wrote results/smoke-result.crd.yaml');

// Exit non-zero if any test failed (lets CI/operators detect failure)
process.exit(failed > 0 ? 1 : 0);
