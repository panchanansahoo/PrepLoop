#!/usr/bin/env pwsh
<#
.SYNOPSIS
    PrepLoop Phase 2 - Master Test Runner
    Orchestrates all Phase 2 tests (integration, load, security)

.PARAMETER Tests
    Which tests to run: 'integration', 'load', 'security', or 'all' (default: all)

.PARAMETER ApiUrl
    The API URL to test against (default: http://localhost:5000)

.PARAMETER StartBackend
    If true, attempts to start the backend first (default: false)

.EXAMPLE
    .\phase2-test-runner.ps1
    .\phase2-test-runner.ps1 -Tests "integration" -ApiUrl "http://localhost:5000"
    .\phase2-test-runner.ps1 -Tests "all" -StartBackend

.NOTES
    Master orchestrator for Phase 2 testing
    Runs PowerShell versions of all tests
#>

param(
    [ValidateSet('integration', 'load', 'security', 'all')]
    [string]$Tests = "all",
    [string]$ApiUrl = "http://localhost:5000",
    [switch]$StartBackend
)

# Colors
$ErrorColor = 'Red'
$SuccessColor = 'Green'
$WarningColor = 'Yellow'
$InfoColor = 'Cyan'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

function Print-Header {
    param([string]$Title)
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor $InfoColor
    Write-Host "║  $Title" -ForegroundColor $InfoColor
    Write-Host "╚════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor $InfoColor
    Write-Host ""
}

function Print-Section {
    param([string]$Title)
    Write-Host "▶ $Title" -ForegroundColor $WarningColor
}

function Print-Pass {
    param([string]$Title)
    Write-Host "✅ $Title" -ForegroundColor $SuccessColor
}

function Print-Fail {
    param([string]$Title)
    Write-Host "❌ $Title" -ForegroundColor $ErrorColor
}

function Print-Info {
    param([string]$Title)
    Write-Host "ℹ️  $Title" -ForegroundColor $InfoColor
}

# ═══════════════════════════════════════════════════════════════════════════
# PHASE 1: Pre-flight Checks
# ═══════════════════════════════════════════════════════════════════════════

Print-Header "PHASE 2 TEST EXECUTION - Pre-flight Checks"

Print-Section "1.1 - Verify API is reachable"
try {
    $response = Invoke-WebRequest -Uri "$ApiUrl/health" -TimeoutSec 5 -ErrorAction Stop
    Print-Pass "API is reachable at $ApiUrl"
    $ApiReady = $true
} catch {
    Print-Fail "API is not reachable at $ApiUrl"
    $ApiReady = $false
    
    if ($StartBackend) {
        Print-Info "Attempting to start backend..."
        try {
            Push-Location "$ScriptDir\..\backend"
            
            # Check if npm run dev is available
            $npm = Get-Command npm -ErrorAction SilentlyContinue
            if ($npm) {
                Write-Host "Starting: npm run dev" -ForegroundColor Cyan
                # Start in new process
                Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run dev" -WindowStyle Minimized
                
                # Wait a bit for backend to start
                Write-Host "Waiting for backend to start..." -ForegroundColor Gray
                Start-Sleep -Seconds 5
                
                # Check again
                try {
                    $response = Invoke-WebRequest -Uri "$ApiUrl/health" -TimeoutSec 5 -ErrorAction Stop
                    Print-Pass "Backend started successfully!"
                    $ApiReady = $true
                } catch {
                    Print-Fail "Backend did not start within expected time"
                    $ApiReady = $false
                }
            } else {
                Print-Fail "npm not found"
            }
            
            Pop-Location
        } catch {
            Print-Fail "Could not start backend: $($_.Exception.Message)"
            $ApiReady = $false
        }
    } else {
        Write-Host ""
        Write-Host "To start the backend, run:" -ForegroundColor $WarningColor
        Write-Host "  cd backend" -ForegroundColor White
        Write-Host "  npm run dev" -ForegroundColor White
        Write-Host ""
    }
}

if (-not $ApiReady) {
    Print-Fail "Tests cannot proceed without API"
    exit 1
}

# ═══════════════════════════════════════════════════════════════════════════
# PHASE 2: Run Tests
# ═══════════════════════════════════════════════════════════════════════════

$AllTestsPassed = $true
$TestsRun = 0
$TestsPassed = 0
$TestsFailed = 0

# Integration Test
if ($Tests -eq "all" -or $Tests -eq "integration") {
    Print-Header "TEST 1: INTEGRATION TESTING"
    
    $integrationScript = "$ScriptDir\integration-test.ps1"
    if (Test-Path $integrationScript) {
        Print-Section "Running integration tests..."
        
        & $integrationScript -ApiUrl $ApiUrl
        if ($?) {
            Print-Pass "Integration tests passed"
            $TestsPassed++
        } else {
            Print-Fail "Integration tests failed"
            $AllTestsPassed = $false
            $TestsFailed++
        }
        $TestsRun++
    } else {
        Print-Fail "Integration test script not found: $integrationScript"
        $AllTestsPassed = $false
    }
}

# Security Test
if ($Tests -eq "all" -or $Tests -eq "security") {
    Print-Header "TEST 2: SECURITY VERIFICATION"
    
    $securityScript = "$ScriptDir\security-verification.ps1"
    if (Test-Path $securityScript) {
        Print-Section "Running security verification..."
        
        & $securityScript -ApiUrl $ApiUrl
        if ($?) {
            Print-Pass "Security verification passed"
            $TestsPassed++
        } else {
            Print-Fail "Security verification failed"
            $AllTestsPassed = $false
            $TestsFailed++
        }
        $TestsRun++
    } else {
        Print-Fail "Security test script not found: $securityScript"
        $AllTestsPassed = $false
    }
}

# Load Test
if ($Tests -eq "all" -or $Tests -eq "load") {
    Print-Header "TEST 3: LOAD TESTING"
    
    $loadScript = "$ScriptDir\load-test.ps1"
    if (Test-Path $loadScript) {
        Print-Section "Running load test (100 users, 60 seconds)..."
        
        & $loadScript -Users 100 -Duration 60 -ApiUrl $ApiUrl
        if ($?) {
            Print-Pass "Load test passed"
            $TestsPassed++
        } else {
            Print-Fail "Load test failed"
            $AllTestsPassed = $false
            $TestsFailed++
        }
        $TestsRun++
    } else {
        Print-Fail "Load test script not found: $loadScript"
        $AllTestsPassed = $false
    }
}

# ═══════════════════════════════════════════════════════════════════════════
# FINAL SUMMARY
# ═══════════════════════════════════════════════════════════════════════════

Print-Header "PHASE 2 TEST EXECUTION - FINAL SUMMARY"

Write-Host "Tests Run: $TestsRun" -ForegroundColor $InfoColor
Write-Host "Passed: $TestsPassed" -ForegroundColor $SuccessColor
Write-Host "Failed: $TestsFailed" -ForegroundColor $ErrorColor

Write-Host ""

if ($AllTestsPassed) {
    Print-Pass "✓ All Phase 2 tests PASSED!"
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor $WarningColor
    Write-Host "  1. Verify results above" -ForegroundColor White
    Write-Host "  2. Run additional load tests if needed" -ForegroundColor White
    Write-Host "  3. Conduct team training" -ForegroundColor White
    Write-Host "  4. Make Go/No-Go decision" -ForegroundColor White
    Write-Host ""
    exit 0
} else {
    Print-Fail "✗ Some Phase 2 tests FAILED"
    Write-Host ""
    Write-Host "Please review failures above and re-run tests." -ForegroundColor $WarningColor
    Write-Host ""
    exit 1
}
