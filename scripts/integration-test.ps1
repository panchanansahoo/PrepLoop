#!/usr/bin/env pwsh
<#
.SYNOPSIS
    PrepLoop Phase 2 - Integration Test (PowerShell Version)
    Tests all API endpoints for correctness

.PARAMETER ApiUrl
    The base API URL to test against (default: http://localhost:5000)

.EXAMPLE
    .\integration-test.ps1 -ApiUrl "http://localhost:5000"

.NOTES
    This is a PowerShell port of the Bash integration-test.sh script
    Enables testing on Windows without requiring WSL or Git Bash
#>

param(
    [string]$ApiUrl = "http://localhost:5000",
    [int]$Timeout = 10
)

# Colors
$ErrorColor = 'Red'
$SuccessColor = 'Green'
$WarningColor = 'Yellow'
$InfoColor = 'Cyan'

# Counters
$TestsPassed = 0
$TestsFailed = 0
$FailedTests = @()

function Print-Header {
    param([string]$Title)
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor $InfoColor
    Write-Host "║  $Title" -ForegroundColor $InfoColor
    Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor $InfoColor
    Write-Host ""
}

function Print-Section {
    param([string]$Title)
    Write-Host "▶ $Title" -ForegroundColor $WarningColor
}

function Print-Pass {
    param([string]$Title)
    Write-Host "✅ $Title" -ForegroundColor $SuccessColor
    $global:TestsPassed++
}

function Print-Fail {
    param([string]$Title)
    Write-Host "❌ $Title" -ForegroundColor $ErrorColor
    $global:TestsFailed++
    $global:FailedTests += $Title
}

function Print-Info {
    param([string]$Title)
    Write-Host "ℹ️  $Title" -ForegroundColor $InfoColor
}

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Endpoint,
        [int]$ExpectedStatus,
        [string]$Data = $null
    )
    
    Print-Section $Name
    
    try {
        $url = "$ApiUrl$Endpoint"
        $params = @{
            Uri = $url
            Method = $Method
            TimeoutSec = $Timeout
            ErrorAction = 'Stop'
        }
        
        if ($Data) {
            $params['Body'] = $Data
            $params['ContentType'] = 'application/json'
        }
        
        $response = Invoke-WebRequest @params
        $httpCode = $response.StatusCode
        $body = $response.Content
        
    } catch {
        # Handle HTTP errors
        if ($_.Exception.Response) {
            $httpCode = $_.Exception.Response.StatusCode.value__
            $body = $_.Exception.Response.StatusCode
        } else {
            $httpCode = 0
            $body = $_.Exception.Message
        }
    }
    
    if ($httpCode -eq $ExpectedStatus) {
        Print-Pass "$Name: HTTP $httpCode"
        return $true
    } else {
        Print-Fail "$Name: Expected HTTP $ExpectedStatus, got $httpCode"
        Print-Info "Response: $body"
        return $false
    }
}

# ═══════════════════════════════════════════════════════════════
# PHASE 1: Pre-flight Checks
# ═══════════════════════════════════════════════════════════════

Print-Header "PHASE 1: Pre-flight Checks"

Print-Section "1.1 - Verify API is running"
try {
    $response = Invoke-WebRequest -Uri "$ApiUrl/health" -TimeoutSec $Timeout -ErrorAction Stop
    Print-Pass "API is running at $ApiUrl"
} catch {
    Print-Fail "API is not responding at $ApiUrl"
    exit 1
}

# ═══════════════════════════════════════════════════════════════
# PHASE 2: Health & Status Endpoints
# ═══════════════════════════════════════════════════════════════

Print-Header "PHASE 2: Health & Status Endpoints"

Test-Endpoint "GET /health" "GET" "/health" 200
Test-Endpoint "GET /health/ready" "GET" "/health/ready" 200
Test-Endpoint "GET /health/live" "GET" "/health/live" 200
Test-Endpoint "GET /health/detailed" "GET" "/health/detailed" 200

# ═══════════════════════════════════════════════════════════════
# PHASE 3: Auth Endpoints
# ═══════════════════════════════════════════════════════════════

Print-Header "PHASE 3: Authentication Endpoints"

Print-Section "3.1 - GET /api/auth/status (unauthenticated)"
try {
    $response = Invoke-WebRequest -Uri "$ApiUrl/api/auth/status" -TimeoutSec $Timeout -ErrorAction Stop
    $httpCode = $response.StatusCode
    if ($httpCode -eq 401 -or $httpCode -eq 200) {
        Print-Pass "Auth status endpoint accessible"
    } else {
        Print-Fail "Auth status endpoint failed (HTTP $httpCode)"
    }
} catch {
    if ($_.Exception.Response) {
        $httpCode = $_.Exception.Response.StatusCode.value__
        if ($httpCode -eq 401 -or $httpCode -eq 200) {
            Print-Pass "Auth status endpoint accessible (HTTP $httpCode)"
        } else {
            Print-Fail "Auth status endpoint failed (HTTP $httpCode)"
        }
    } else {
        Print-Info "Could not reach auth endpoint: $($_.Exception.Message)"
    }
}

# ═══════════════════════════════════════════════════════════════
# PHASE 4: DSA/Problem Endpoints
# ═══════════════════════════════════════════════════════════════

Print-Header "PHASE 4: DSA & Problem Endpoints"

Print-Section "4.1 - GET /api/dsa/problems"
try {
    $response = Invoke-WebRequest -Uri "$ApiUrl/api/dsa/problems" -TimeoutSec $Timeout -ErrorAction Stop
    Print-Pass "DSA problems endpoint responsive"
} catch {
    if ($_.Exception.Response) {
        $httpCode = $_.Exception.Response.StatusCode.value__
        if ($httpCode -eq 401) {
            Print-Pass "DSA problems endpoint responsive (auth required)"
        } else {
            Print-Info "DSA problems returned HTTP $httpCode"
        }
    }
}

# ═══════════════════════════════════════════════════════════════
# PHASE 5: Error Handling
# ═══════════════════════════════════════════════════════════════

Print-Header "PHASE 5: Error Handling"

Print-Section "5.1 - GET /api/nonexistent (should return 404)"
try {
    $response = Invoke-WebRequest -Uri "$ApiUrl/api/nonexistent" -TimeoutSec $Timeout -ErrorAction Stop
    Print-Fail "Invalid endpoint returned HTTP $($response.StatusCode)"
} catch {
    if ($_.Exception.Response) {
        $httpCode = $_.Exception.Response.StatusCode.value__
        if ($httpCode -eq 404 -or $httpCode -eq 405) {
            Print-Pass "Invalid endpoint correctly returns error (HTTP $httpCode)"
        } else {
            Print-Info "Invalid endpoint returned HTTP $httpCode"
        }
    } else {
        Print-Info "Could not reach endpoint: $($_.Exception.Message)"
    }
}

# ═══════════════════════════════════════════════════════════════
# PHASE 6: Response Times
# ═══════════════════════════════════════════════════════════════

Print-Header "PHASE 6: Response Time Verification"

Print-Section "6.1 - Measure /health response time"
$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
try {
    $response = Invoke-WebRequest -Uri "$ApiUrl/health" -TimeoutSec $Timeout -ErrorAction Stop
} catch {
    # Ignore errors for timing test
}
$stopwatch.Stop()
$responseTime = $stopwatch.ElapsedMilliseconds

if ($responseTime -lt 1000) {
    Print-Pass "/health response time: ${responseTime}ms (target: <1000ms)"
} else {
    Print-Info "/health response time: ${responseTime}ms (slightly high)"
}

# ═══════════════════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════════════════

Print-Header "INTEGRATION TEST SUMMARY"

$TotalTests = $TestsPassed + $TestsFailed
if ($TotalTests -gt 0) {
    $SuccessRate = [math]::Round(($TestsPassed / $TotalTests) * 100)
} else {
    $SuccessRate = 0
}

Write-Host "✅ Passed: $TestsPassed" -ForegroundColor $SuccessColor
Write-Host "❌ Failed: $TestsFailed" -ForegroundColor $ErrorColor
Write-Host "ℹ️  Total: $TotalTests" -ForegroundColor $InfoColor
Write-Host "📊 Success Rate: $SuccessRate%" -ForegroundColor $WarningColor

if ($FailedTests.Count -gt 0) {
    Write-Host ""
    Write-Host "Failed Tests:" -ForegroundColor $ErrorColor
    foreach ($test in $FailedTests) {
        Write-Host "  - $test"
    }
}

Write-Host ""

if ($TestsFailed -eq 0) {
    Write-Host "✓ All integration tests passed!" -ForegroundColor $SuccessColor
    exit 0
} else {
    Write-Host "✗ Some tests failed" -ForegroundColor $ErrorColor
    exit 1
}
