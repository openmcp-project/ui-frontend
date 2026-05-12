# Project-specific PreToolUse hook: block Read/Edit/Write/Glob/Grep on
# public/frontend-config.json. The file is gitignored and intentionally
# created by each developer (cp frontend-config.json public/frontend-config.json),
# but it contains the backend URL that leaks the deployment topology. Treat
# it as sensitive by policy. The template at the repo root (frontend-config.json)
# is the documented entrypoint -- read or edit that instead.
#
# ASCII-only output (Windows PowerShell 5.1 mis-decodes UTF-8 files).

$ErrorActionPreference = 'Stop'

try {
    $raw = [Console]::In.ReadToEnd()
    if ([string]::IsNullOrWhiteSpace($raw)) { exit 0 }
    $data = $raw | ConvertFrom-Json
} catch { exit 0 }

$paths = New-Object System.Collections.Generic.List[string]
$ti = $data.tool_input
if ($null -ne $ti) {
    foreach ($prop in 'file_path','path','notebook_path','pattern') {
        $val = $ti.$prop
        if ($val -is [string] -and $val.Length -gt 0) { $paths.Add($val) }
    }
}
if ($paths.Count -eq 0) { exit 0 }

foreach ($p in $paths) {
    $norm = $p -replace '\\','/'
    if ($norm -match '(^|/)public/frontend-config\.json$') {
        [Console]::Error.WriteLine("blocked by project security hook -- path '$p' is public/frontend-config.json, which is gitignored and contains the backend URL. Read or edit the template at the repo root (./frontend-config.json) instead. If you really need to inspect the local copy, do it in a separate terminal outside Claude Code.")
        exit 2
    }
}

exit 0
