// Shared helpers for Claude Code hook scripts.
// ES module, runs on Node 20+. No external deps.

export async function readStdinJson() {
  let raw = '';
  for await (const chunk of process.stdin) raw += chunk;
  if (!raw.trim()) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Pull every plausible "path-like" value out of tool_input.
// Different tools name the field differently (file_path, path, pattern, …).
export function collectPaths(toolInput) {
  if (!toolInput || typeof toolInput !== 'object') return [];
  const out = [];
  for (const key of ['file_path', 'path', 'notebook_path', 'pattern']) {
    const v = toolInput[key];
    if (typeof v === 'string' && v.length > 0) out.push(v);
  }
  return out;
}

// Windows backslashes -> forward slashes, for portable regex matching.
export function normalizePath(p) {
  return p.replace(/\\/g, '/');
}

// Emit a deny: stderr message + exit code 2 (Claude Code's "block" signal).
export function deny(message) {
  process.stderr.write(message + '\n');
  process.exit(2);
}

// Quiet allow.
export function allow() {
  process.exit(0);
}
