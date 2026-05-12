# PreToolUse hook: block Read/Edit/Write/Glob/Grep on secret-bearing paths.
# Reads JSON from stdin, exits 2 + stderr message to deny, exits 0 to allow.
# ASCII-only output (Windows PowerShell 5.1 mis-decodes UTF-8 files).

$ErrorActionPreference = 'Stop'

try {
    $raw = [Console]::In.ReadToEnd()
    if ([string]::IsNullOrWhiteSpace($raw)) { exit 0 }
    $data = $raw | ConvertFrom-Json
} catch {
    # If we can't parse input, fail open (don't block the user).
    exit 0
}

# Collect candidate paths from tool_input. Different tools use different fields.
$paths = New-Object System.Collections.Generic.List[string]
$ti = $data.tool_input
if ($null -ne $ti) {
    foreach ($prop in 'file_path','path','notebook_path','pattern') {
        $val = $ti.$prop
        if ($val -is [string] -and $val.Length -gt 0) { $paths.Add($val) }
    }
}
if ($paths.Count -eq 0) { exit 0 }

# Whitelist: template/example/sample env files are documentation, not secrets.
$whitelist = @(
    '\.env\.template$',
    '\.env\.example$',
    '\.env\.sample$',
    '\.env\.dist$'
)

# Secret file patterns. Normalized to forward slashes for matching.
$secretPatterns = @(
    @{ name = '.env file';                pattern = '(^|/)\.env($|\.[^/]*$)' },
    @{ name = 'env file (suffix)';        pattern = '\.env$' },
    @{ name = 'secrets/ directory';       pattern = '(^|/)\.?secrets/' },
    @{ name = 'credentials/ directory';   pattern = '(^|/)credentials/' },
    @{ name = 'PEM/key file';             pattern = '\.(pem|key|p12|pfx|jks|keystore)$' },
    @{ name = 'SSH private key';          pattern = '(^|/)(id_rsa|id_ed25519|id_ecdsa|id_dsa)(\.pub)?$' },
    @{ name = '.ssh directory';           pattern = '(^|/)\.ssh/' },
    @{ name = '.gnupg directory';         pattern = '(^|/)\.gnupg/' },
    @{ name = 'AWS credentials';          pattern = '(^|/)\.aws/(credentials|config)$' },
    @{ name = 'kubeconfig';               pattern = '(^|/)(kubeconfig|\.kube/config)$' },
    @{ name = 'GCP service account';      pattern = '(^|/)service-account[^/]*\.json$' },
    @{ name = '.npmrc/.pypirc auth';      pattern = '(^|/)(\.npmrc|\.pypirc|\.pgpass|\.netrc)$' }
)

foreach ($p in $paths) {
    $norm = $p -replace '\\','/'

    $isWhitelisted = $false
    foreach ($w in $whitelist) {
        if ($norm -match $w) { $isWhitelisted = $true; break }
    }
    if ($isWhitelisted) { continue }

    foreach ($sp in $secretPatterns) {
        if ($norm -match $sp.pattern) {
            [Console]::Error.WriteLine("blocked by security hook -- path '$p' matches secret pattern: $($sp.name). If intentional, ask the user to add an explicit exception (e.g. via permissions.allow in settings.local.json) or operate on the file outside Claude Code.")
            exit 2
        }
    }
}

exit 0
