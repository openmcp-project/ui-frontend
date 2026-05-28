#!/usr/bin/env node
// Project-specific PreToolUse hook: block Read/Edit/Write/Glob/Grep on
// public/frontend-config.json. The file is gitignored and intentionally
// created by each developer (cp frontend-config.json public/frontend-config.json),
// but it contains the backend URL that leaks the deployment topology. The
// template at the repo root (frontend-config.json) is the documented entrypoint.

import { readStdinJson, collectPaths, normalizePath, deny, allow } from './_io.mjs';

const data = await readStdinJson();
if (!data) allow();

const paths = collectPaths(data.tool_input);
if (paths.length === 0) allow();

for (const p of paths) {
  const norm = normalizePath(p);
  if (/(^|\/)public\/frontend-config\.json$/.test(norm)) {
    deny(
      `blocked by project security hook -- path '${p}' is public/frontend-config.json, ` +
      `which is gitignored and contains the backend URL. Read or edit the template at ` +
      `the repo root (./frontend-config.json) instead. If you really need to inspect the ` +
      `local copy, do it in a separate terminal outside Claude Code.`
    );
  }
}

allow();
