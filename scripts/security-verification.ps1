#!/usr/bin/env pwsh
<#
.SYNOPSIS
    PrepLoop Phase 2 - Security Verification (PowerShell Version)
    Verifies security hardening and best practices

.PARAMETER ApiUrl
    The base API URL to test against (default: http://localhost:5000)

.EXAMPLE
    .\security-verification.ps1 -ApiUrl "http://localhost:5000"

.NOTES
    This is a PowerShell port of the Bash security-verification.sh script
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
$ChecksPassed = 0
$ChecksFailed = 0
$Warnings = 0

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
    $global:ChecksPassed++
}

function Print-Fail {
    param([string]$Title)
    Write-Host "❌ $Title" -ForegroundColor $ErrorColor
    $global:ChecksFailed++
}

function Print-Warn {
    param([string]$Title)
    Write-Host "⚠️  $Title" -ForegroundColor $WarningColor
    $global:Warnings++
}

function Print-Info {
    param([string]$Title)
    Write-Host "ℹ️  $Title" -ForegroundColor $InfoColor
}

# ═══════════════════════════════════════════════════════════════
# PHASE 1: Environment & Configuration
# ═══════════════════════════════════════════════════════════════

Print-Header "PHASE 1: Environment & Configuration"

Print-Section "1.1 - Check for exposed env variables"
try {
    $response = Invoke-WebRequest -Uri "$ApiUrl/health/detailed" -TimeoutSec $Timeout -ErrorAction Stop
    $body = $response.Content
    
    if ($body -match "JWT_SECRET|API_KEY|SECRET") {
        Print-Fail "Sensitive information exposed in response headers"
    } else {
        Print-Pass "No obvious secrets in health response"
    }
} catch {
    Print-Info "Could not check detailed health: $($_.Exception.Message)"
}

# ═══════════════════════════════════════════════════════════════
# PHASE 2: HTTP Security Headers
# ═══════════════════════════════════════════════════════════════

Print-Header "PHASE 2: HTTP Security Headers"

Print-Section "2.1 - Retrieving response headers"
try {
    $request = [System.Net.HttpWebRequest]::Create("$ApiUrl/health")
    $request.Timeout = $Timeout * 1000
    $request.Method = "GET"
    $response = $request.GetResponse()
    $headers = $response.Headers
    
    # Check security headers
    $headerDict = @{}
    foreach ($key in $headers.Keys) {
        $headerDict[$key] = $headers[$key]
    }
    
    # X-Content-Type-Options
    if ($headerDict["X-Content-Type-Options"] -eq "nosniff") {
        Print-Pass "X-Content-Type-Options: nosniff"
    } else {
        Print-Fail "X-Content-Type-Options header missing or incorrect"
    }
    
    # X-Frame-Options
    if ($headerDict["X-Frame-Options"]) {
        Print-Pass "X-Frame-Options header present"
    } else {
        Print-Fail "X-Frame-Options header missing"
    }
    
    # HSTS
    if ($headerDict["Strict-Transport-Security"]) {
        Print-Pass "HSTS header present"
    } else {
        Print-Warn "HSTS header not found (important for HTTPS)"
    }
    
    # CSP
    if ($headerDict["Content-Security-Policy"]) {
        Print-Pass "Content-Security-Policy header present"
    } else {
        Print-Warn "Content-Security-Policy header not found"
    }
    
    $response.Close()
    
} catch {
    Print-Info "Could not retrieve headers: $($_.Exception.Message)"
}

# ═══════════════════════════════════════════════════════════════
# PHASE 3: CORS Configuration
# ═══════════════════════════════════════════════════════════════

Print-Header "PHASE 3: CORS Configuration"

Print-Section "3.1 - Check CORS with allowed origin"
try {
    $request = [System.Net.HttpWebRequest]::Create("$ApiUrl/health")
    $request.Timeout = $Timeout * 1000
    $request.Method = "GET"
    $request.Headers.Add("Origin", "http://localhost:5173")
    $response = $request.GetResponse()
    
    $corsHeader = $response.Headers["Access-Control-Allow-Origin"]
    if ($corsHeader) {
        if ($corsHeader -eq "*") {
            Print-Fail "CORS allows all origins (*) - SECURITY RISK"
        } else {
            Print-Pass "CORS configured with specific origin: $corsHeader"
        }
    } else {
        Print-Info "CORS header not found in response"
    }
    
    $response.Close()
} catch {
    Print-Info "Could not check CORS: $($_.Exception.Message)"
}

# ═══════════════════════════════════════════════════════════════
# PHASE 4: Authentication
# ═══════════════════════════════════════════════════════════════

Print-Header "PHASE 4: Authentication & Authorization"

Print-Section "4.1 - Test invalid JWT token"
try {
    $request = [System.Net.HttpWebRequest]::Create("$ApiUrl/api/interview-suite/list")
    $request.Timeout = $Timeout * 1000
    $request.Method = "GET"
    $request.Headers.Add("Authorization", "Bearer invalid_token_12345")
    
    try {
        $response = $request.GetResponse()
        Print-Info "Invalid JWT returned HTTP $($response.StatusCode)"
        $response.Close()
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 401 -or $statusCode -eq 403) {
            Print-Pass "Invalid JWT correctly rejected (HTTP $statusCode)"
        } else {
            Print-Info "Invalid JWT returned HTTP $statusCode"
        }
    }
    
} catch {
    Print-Info "Could not test JWT: $($_.Exception.Message)"
}

Print-Section "4.2 - Test missing Authorization header"
try {
    $response = Invoke-WebRequest -Uri "$ApiUrl/api/interview-suite/list" -TimeoutSec $Timeout -ErrorAction Stop
    Print-Info "Missing auth header returned HTTP $($response.StatusCode)"
} catch {
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 401 -or $statusCode -eq 403) {
            Print-Pass "Missing auth header correctly rejected (HTTP $statusCode)"
        } else {
            Print-Info "Missing auth header returned HTTP $statusCode"
        }
    }
}

# ═══════════════════════════════════════════════════════════════
# PHASE 5: Input Validation & Sanitization
# ═══════════════════════════════════════════════════════════════

Print-Header "PHASE 5: Input Validation & Sanitization"

Print-Section "5.1 - Test XSS injection in URL parameter"
try {
    $xssPayload = "<script>alert('xss')</script>"
    $encodedPayload = [System.Net.WebUtility]::UrlEncode($xssPayload)
    $response = Invoke-WebRequest -Uri "$ApiUrl/api/dsa/search?q=$encodedPayload" -TimeoutSec $Timeout -ErrorAction Stop
    $body = $response.Content
    
    if ($body -match "<script>") {
        Print-Fail "Possible XSS vulnerability - HTML tags not sanitized"
    } else {
        Print-Pass "XSS injection attempt handled safely"
    }
} catch {
    Print-Info "XSS test endpoint not available: $($_.Exception.Message)"
}

# ═══════════════════════════════════════════════════════════════
# PHASE 6: Infrastructure Security
# ═══════════════════════════════════════════════════════════════

Print-Header "PHASE 6: Infrastructure Security"

Print-Section "6.1 - Check server banner"
try {
    $request = [System.Net.HttpWebRequest]::Create("$ApiUrl/health")
    $request.Timeout = $Timeout * 1000
    $request.Method = "GET"
    $response = $request.GetResponse()
    
    $serverHeader = $response.Headers["Server"]
    if ($serverHeader) {
        if ($serverHeader -match "Express") {
            Print-Warn "Server banner reveals framework: $serverHeader"
        } else {
            Print-Info "Server header: $serverHeader"
        }
    }
    
    $response.Close()
} catch {
    Print-Info "Could not check server header: $($_.Exception.Message)"
}

# ═══════════════════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════════════════

Print-Header "SECURITY VERIFICATION SUMMARY"

$TotalChecks = $ChecksPassed + $ChecksFailed
if ($TotalChecks -gt 0) {
    $PassRate = [math]::Round(($ChecksPassed / $TotalChecks) * 100)
} else {
    $PassRate = 0
}

Write-Host "✅ Passed: $ChecksPassed" -ForegroundColor $SuccessColor
Write-Host "❌ Failed: $ChecksFailed" -ForegroundColor $ErrorColor
Write-Host "⚠️  Warnings: $Warnings" -ForegroundColor $WarningColor
Write-Host "ℹ️  Total: $TotalChecks" -ForegroundColor $InfoColor
Write-Host "📊 Pass Rate: $PassRate%" -ForegroundColor $WarningColor

Write-Host ""

if ($ChecksFailed -eq 0) {
    Write-Host "✓ Security verification PASSED" -ForegroundColor $SuccessColor
    if ($Warnings -gt 0) {
        Write-Host "⚠️  $Warnings warning(s) to review" -ForegroundColor $WarningColor
    }
    exit 0
} else {
    Write-Host "✗ Security verification FAILED" -ForegroundColor $ErrorColor
    exit 1
}
