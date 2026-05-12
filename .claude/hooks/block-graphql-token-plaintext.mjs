#!/usr/bin/env node
// Project-specific PreToolUse hook for Bash + PowerShell tools.
// Block `npm run generate-graphql-types -- <token>` when the token appears
// as a plain-text positional argument. scripts/generate-graphql-types.sh
// bakes the arg into the Authorization header; a literal token there ends
// up in shell history, transcripts, and incident logs.

import { readStdinJson, deny, allow } from './_io.mjs';

const data = await readStdinJson();
if (!data) allow();

const cmd = data.tool_input?.command;
if (typeof cmd !== 'string' || cmd.trim() === '') allow();

// Only inspect commands that actually invoke the codegen script.
if (!/generate-graphql-types(:watch)?/i.test(cmd)) allow();

const m = cmd.match(/generate-graphql-types(:watch)?\b[^|;&]*?\s--\s+(\S+)/i);
if (!m) allow();

let tokenArg = m[2];
// Strip outer quotes.
if ((tokenArg.startsWith('"') && tokenArg.endsWith('"')) ||
    (tokenArg.startsWith("'") && tokenArg.endsWith("'"))) {
  tokenArg = tokenArg.slice(1, -1);
}

// Variable references / env-var passthrough are fine -- expansion is opaque.
if (/^\$/.test(tokenArg)) allow();          // bash $VAR or PS $env:VAR
if (/^\$\{/.test(tokenArg)) allow();        // bash ${VAR}
if (/^%[A-Za-z_]/.test(tokenArg)) allow();  // cmd %VAR%
if (/^`[^`]*`$/.test(tokenArg)) allow();    // backtick subshell

const literalPatterns = [
  { p: /^eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/, name: 'JWT' },
  { p: /^ghp_[A-Za-z0-9]{30,}$/,                                  name: 'GitHub PAT' },
  { p: /^gh[osu]_[A-Za-z0-9]{30,}$/,                              name: 'GitHub OAuth/user/server token' },
  { p: /^sk-ant-[A-Za-z0-9_-]{20,}$/,                             name: 'Anthropic API key' },
  { p: /^sk-[A-Za-z0-9]{30,}$/,                                   name: 'OpenAI-style API key' },
  { p: /^[A-Za-z0-9_-]{40,}$/,                                    name: 'likely opaque token (40+ chars)' },
];

for (const { p, name } of literalPatterns) {
  if (p.test(tokenArg)) {
    deny(
      `blocked by project security hook: 'npm run generate-graphql-types' was invoked with a plain-text ${name} ` +
      `as a positional argument. Put the token in an env var first and reference it -- e.g.:\n` +
      `  bash:       GRAPHQL_TOKEN=... npm run generate-graphql-types -- "$GRAPHQL_TOKEN"\n` +
      `  PowerShell: $env:GRAPHQL_TOKEN = '...'; npm run generate-graphql-types -- $env:GRAPHQL_TOKEN\n` +
      `This keeps the token out of shell history and Claude transcripts.`
    );
  }
}

allow();
