# Project-specific PreToolUse hook for Bash + PowerShell tools.
# Block `npm run generate-graphql-types -- <token>` when the token appears
# as a plain-text positional argument. The script (scripts/generate-graphql-types.sh)
# accepts the token and bakes it into the `Authorization` header, so a token
# passed as an argument ends up in shell history, transcripts, and -- if Claude
# transcripts get shared -- in incident logs.
#
# Acceptable forms:
#   GRAPHQL_AUTH_TOKEN="Bearer $TOKEN" npm run generate-graphql-types
#   npm run generate-graphql-types -- "$TOKEN"           (variable expansion, opaque to us)
#   npm run generate-graphql-types -- $env:GRAPHQL_TOKEN (PS var ref)
#
# Blocked forms:
#   npm run generate-graphql-types -- ey...              (literal JWT)
#   npm run generate-graphql-types -- ghp_...            (literal GH PAT)
#   npm run generate-graphql-types -- sk-ant-...         (literal API key)
#   npm run generate-graphql-types -- <40+ chars>        (likely literal token)
#
# ASCII-only output (Windows PowerShell 5.1 mis-decodes UTF-8 files).

$ErrorActionPreference = 'Stop'

try {
    $raw = [Console]::In.ReadToEnd()
    if ([string]::IsNullOrWhiteSpace($raw)) { exit 0 }
    $data = $raw | ConvertFrom-Json
} catch { exit 0 }

$cmd = $data.tool_input.command
if ([string]::IsNullOrWhiteSpace($cmd)) { exit 0 }

# Only inspect the command if it actually invokes the codegen script.
if ($cmd -inotmatch 'generate-graphql-types(:watch)?') { exit 0 }

# Find the argument immediately after `--`. If there isn't one, allow.
if ($cmd -inotmatch 'generate-graphql-types(:watch)?\b[^|;&]*?\s--\s+(\S+)') { exit 0 }
$tokenArg = $matches[2]

# Variable references / env-var passthrough are fine -- expansion is opaque to us.
# Strip outer quotes for inspection.
$bare = $tokenArg.Trim('"').Trim("'")
if ($bare -match '^\$') { exit 0 }              # bash $VAR or $env:VAR or $VAR
if ($bare -match '^\$\{')   { exit 0 }          # bash ${VAR}
if ($bare -match '^%[A-Za-z_]') { exit 0 }      # cmd %VAR%
if ($bare -match '^`[^`]*`$')   { exit 0 }      # backtick subshell

# Patterns that strongly indicate a literal secret.
$literalPatterns = @(
    @{ p = '^eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$'; name = 'JWT' },
    @{ p = '^ghp_[A-Za-z0-9]{30,}$';                                  name = 'GitHub PAT' },
    @{ p = '^gh[osu]_[A-Za-z0-9]{30,}$';                              name = 'GitHub OAuth/user/server token' },
    @{ p = '^sk-ant-[A-Za-z0-9_-]{20,}$';                             name = 'Anthropic API key' },
    @{ p = '^sk-[A-Za-z0-9]{30,}$';                                   name = 'OpenAI-style API key' },
    @{ p = '^[A-Za-z0-9_-]{40,}$';                                    name = 'likely opaque token (40+ chars)' }
)

foreach ($entry in $literalPatterns) {
    if ($bare -match $entry.p) {
        [Console]::Error.WriteLine("blocked by project security hook: 'npm run generate-graphql-types' was invoked with a plain-text $($entry.name) as a positional argument. Put the token in an env var first and reference it -- e.g.: `$env:GRAPHQL_TOKEN = '...'; npm run generate-graphql-types -- `$env:GRAPHQL_TOKEN  (or, in bash: GRAPHQL_TOKEN=... ; npm run generate-graphql-types -- `"`$GRAPHQL_TOKEN`"). This keeps the token out of shell history and Claude transcripts.")
        exit 2
    }
}

exit 0
