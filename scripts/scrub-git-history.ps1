# Git History Secret Scrubbing Utility for PrepLoop (PowerShell)
# Target Commit: dc71871221b848a720397f8454c3fb95936e7959
# Target Secret: 10042001@Sb (Razorpay Webhook Secret in scripts/test-webhook.js)

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "🔒 PREPLOOP GIT HISTORY SECRET SCRUBBER (PowerShell)" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

$replaceFile = Join-Path $PSScriptRoot "replace-patterns.txt"
"10042001@Sb==>REDACTED_WEBHOOK_SECRET" | Out-File -FilePath $replaceFile -Encoding ascii

if (Get-Command git-filter-repo -ErrorAction SilentlyContinue) {
    Write-Host "Running git-filter-repo..." -ForegroundColor Green
    git filter-repo --replace-text $replaceFile --force
} else {
    Write-Host "git-filter-repo not found. Run: pip install git-filter-repo" -ForegroundColor Yellow
    Write-Host "Or execute native git filter-branch:" -ForegroundColor Yellow
    Write-Host 'git filter-branch --force --tree-filter "if (Test-Path scripts/test-webhook.js) { (Get-Content scripts/test-webhook.js) -replace ''10042001@Sb'', ''process.env.RAZORPAY_WEBHOOK_SECRET'' | Set-Content scripts/test-webhook.js }" --tag-name-filter cat -- --all'
}

if (Test-Path $replaceFile) {
    Remove-Item $replaceFile -Force
}

Write-Host "`nPost-scrub required steps:" -ForegroundColor Red
Write-Host "1. git push origin --force --all"
Write-Host "2. git push origin --force --tags"
Write-Host "3. In Razorpay Dashboard -> Settings -> Webhooks -> Rotate secret immediately."
