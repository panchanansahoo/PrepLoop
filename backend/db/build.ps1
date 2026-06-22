$ErrorActionPreference = 'Stop'
$files = @(Get-Item E:\PrepLoop\backend\db\schema.sql)
$files += Get-ChildItem -Path E:\PrepLoop\backend\db\schema_*.sql
$files += Get-ChildItem -Path E:\PrepLoop\backend\db\migration_*.sql

$content = ""
foreach ($f in $files) {
    $content += "`n`n-- =========================================="
    $content += "`n-- File: $($f.Name)"
    $content += "`n-- ==========================================`n`n"
    $content += Get-Content $f.FullName -Raw
}

# Fix policies
$content = [regex]::Replace($content, '(?i)CREATE\s+POLICY\s+("?[^"]+"?|[A-Za-z0-9_]+)\s+ON\s+([A-Za-z0-9_\.]+)', "DROP POLICY IF EXISTS `$1 ON `$2;`nCREATE POLICY `$1 ON `$2")

# Fix indexes
$content = [regex]::Replace($content, '(?i)CREATE\s+INDEX\s+(?!IF\s+NOT\s+EXISTS\s+)([A-Za-z0-9_]+)\s+ON\s+([A-Za-z0-9_\.]+)', "CREATE INDEX IF NOT EXISTS `$1 ON `$2")

# Fix triggers (including AFTER/BEFORE INSERT OR UPDATE etc.)
# We capture the full event string
$content = [regex]::Replace($content, '(?i)CREATE\s+TRIGGER\s+([A-Za-z0-9_]+)\s+((?:AFTER|BEFORE|INSTEAD\s+OF)\s+(?:INSERT|UPDATE|DELETE|TRUNCATE)(?:\s+OR\s+(?:INSERT|UPDATE|DELETE|TRUNCATE))*)\s+ON\s+([A-Za-z0-9_\.]+)', "DROP TRIGGER IF EXISTS `$1 ON `$3;`nCREATE TRIGGER `$1 `$2 ON `$3")

Set-Content -Path E:\PrepLoop\backend\db\master_setup.sql -Value $content
Write-Host "Rebuild complete"
