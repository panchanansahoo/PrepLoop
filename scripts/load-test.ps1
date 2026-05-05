#!/usr/bin/env pwsh
<#
.SYNOPSIS
    PrepLoop Phase 2 - Load Test (PowerShell Version)
    Tests system under concurrent load

.PARAMETER Users
    Number of concurrent users to simulate (default: 100)

.PARAMETER Duration
    Duration of test in seconds (default: 60)

.PARAMETER ApiUrl
    The base API URL to test against (default: http://localhost:5000)

.EXAMPLE
    .\load-test.ps1 -Users 100 -Duration 60 -ApiUrl "http://localhost:5000"

.NOTES
    This is a PowerShell port of the Bash load-test.sh script
    Enables load testing on Windows without requiring WSL or Git Bash
#>

param(
    [int]$Users = 100,
    [int]$Duration = 60,
    [string]$ApiUrl = "http://localhost:5000"
)

# Colors
$ErrorColor = 'Red'
$SuccessColor = 'Green'
$WarningColor = 'Yellow'
$InfoColor = 'Cyan'

# Counters
$TotalRequests = 0
$SuccessfulRequests = 0
$FailedRequests = 0
$TotalTime = 0
$MinTime = [int]::MaxValue
$MaxTime = 0
$ResponseTimes = @()

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
}

function Print-Fail {
    param([string]$Title)
    Write-Host "❌ $Title" -ForegroundColor $ErrorColor
}

function Print-Info {
    param([string]$Title)
    Write-Host "ℹ️  $Title" -ForegroundColor $InfoColor
}

function Print-Metric {
    param([string]$Title)
    Write-Host "📊 $Title" -ForegroundColor 'Magenta'
}

# ═══════════════════════════════════════════════════════════════
# PHASE 1: Pre-flight Checks
# ═══════════════════════════════════════════════════════════════

Print-Header "PHASE 1: Pre-flight Checks"

Print-Section "1.1 - Check if API is reachable"
try {
    $response = Invoke-WebRequest -Uri "$ApiUrl/health" -TimeoutSec 5 -ErrorAction Stop
    Print-Pass "API is reachable at $ApiUrl"
} catch {
    Print-Fail "API is not reachable at $ApiUrl"
    exit 1
}

Print-Section "1.2 - Verify load test parameters"
Print-Info "Users: $Users"
Print-Info "Duration: ${Duration}s"
Print-Info "Target URL: $ApiUrl/health"

# ═══════════════════════════════════════════════════════════════
# PHASE 2: Simulate Load
# ═══════════════════════════════════════════════════════════════

Print-Header "PHASE 2: Simulating Load"

Print-Section "2.1 - Starting load test"
$StartTime = Get-Date
$EndTime = $StartTime.AddSeconds($Duration)
$RampUpTime = 10
$CurrentParallel = 0
$RequestCount = 0

Write-Host ""

# PowerShell job-based concurrent requests
$jobs = @()

while ((Get-Date) -lt $EndTime) {
    $ElapsedSeconds = ((Get-Date) - $StartTime).TotalSeconds
    
    # Ramp-up calculation
    if ($ElapsedSeconds -lt $RampUpTime) {
        $CurrentParallel = [int](($ElapsedSeconds / $RampUpTime) * $Users)
    } else {
        $CurrentParallel = $Users
    }
    
    # Submit requests up to current parallel level
    while ($RequestCount -lt $CurrentParallel) {
        $job = Start-Job -ScriptBlock {
            param($Url, $Index)
            
            $reqStart = Get-Date
            try {
                $response = Invoke-WebRequest -Uri $Url -TimeoutSec 10 -ErrorAction Stop
                $httpCode = $response.StatusCode
            } catch {
                if ($_.Exception.Response) {
                    $httpCode = $_.Exception.Response.StatusCode.value__
                } else {
                    $httpCode = 0
                }
            }
            $reqEnd = Get-Date
            $responseTime = ($reqEnd - $reqStart).TotalMilliseconds
            
            return @{
                httpCode = $httpCode
                responseTime = $responseTime
            }
            
        } -ArgumentList "$ApiUrl/health", $RequestCount
        
        $jobs += $job
        $RequestCount++
        
        # Limit concurrent jobs
        $runningJobs = @($jobs | Where-Object { $_.State -eq 'Running' })
        if ($runningJobs.Count -ge 50) {
            Start-Sleep -Milliseconds 100
        }
    }
    
    # Progress
    if ([int]$ElapsedSeconds % 10 -eq 0) {
        $activeJobs = @($jobs | Where-Object { $_.State -eq 'Running' }).Count
        Print-Metric "Progress: $([int]$ElapsedSeconds)/${Duration}s | Active jobs: $activeJobs | Total requests: $RequestCount"
    }
    
    Start-Sleep -Milliseconds 100
}

Print-Section "2.2 - Waiting for all requests to complete..."
$jobs | Wait-Job | Out-Null

# ═══════════════════════════════════════════════════════════════
# PHASE 3: Analyze Results
# ═══════════════════════════════════════════════════════════════

Print-Header "PHASE 3: Analyzing Results"

Print-Section "3.1 - Processing results"

foreach ($job in $jobs) {
    try {
        $result = Receive-Job -Job $job
        if ($result) {
            $TotalRequests++
            $ResponseTimes += $result.responseTime
            $TotalTime += $result.responseTime
            
            if ($result.httpCode -eq 200) {
                $SuccessfulRequests++
            } else {
                $FailedRequests++
            }
            
            if ($result.responseTime -lt $MinTime) {
                $MinTime = $result.responseTime
            }
            if ($result.responseTime -gt $MaxTime) {
                $MaxTime = $result.responseTime
            }
        }
    } catch {
        # Ignore job errors
    }
    Remove-Job -Job $job
}

# Calculate metrics
if ($TotalRequests -gt 0) {
    $AvgTime = [math]::Round($TotalTime / $TotalRequests, 2)
    $SuccessRate = [math]::Round(($SuccessfulRequests / $TotalRequests) * 100, 1)
    $ErrorRate = [math]::Round(($FailedRequests / $TotalRequests) * 100, 1)
    $RequestsPerSec = [math]::Round($TotalRequests / $Duration, 1)
} else {
    $AvgTime = 0
    $SuccessRate = 0
    $ErrorRate = 0
    $RequestsPerSec = 0
}

Print-Section "3.2 - Request Statistics"
Print-Metric "Total Requests: $TotalRequests"
Print-Metric "Successful: $SuccessfulRequests (${SuccessRate}%)"
Print-Metric "Failed: $FailedRequests (${ErrorRate}%)"
Print-Metric "Throughput: ${RequestsPerSec} req/sec"

Print-Section "3.3 - Response Time Statistics"
Print-Metric "Average: ${AvgTime}ms"
Print-Metric "Min: $MinTime ms"
Print-Metric "Max: $MaxTime ms"

# Calculate percentiles
if ($ResponseTimes.Count -gt 0) {
    $sorted = $ResponseTimes | Sort-Object
    $p95Index = [int]($sorted.Count * 0.95)
    $p99Index = [int]($sorted.Count * 0.99)
    
    $p95 = [math]::Round($sorted[$p95Index], 2)
    $p99 = [math]::Round($sorted[$p99Index], 2)
    
    Print-Metric "P95: ${p95}ms"
    Print-Metric "P99: ${p99}ms"
}

# ═══════════════════════════════════════════════════════════════
# PHASE 4: Performance Assessment
# ═══════════════════════════════════════════════════════════════

Print-Header "PHASE 4: Performance Assessment"

$Issues = 0

# Check response times
if ($AvgTime -gt 500) {
    Print-Fail "Average response time too high (${AvgTime}ms, target: <500ms)"
    $Issues++
} else {
    Print-Pass "Average response time acceptable (${AvgTime}ms)"
}

# Check error rate
if ($ErrorRate -gt 5) {
    Print-Fail "Error rate too high (${ErrorRate}%, target: <5%)"
    $Issues++
} else {
    Print-Pass "Error rate acceptable (${ErrorRate}%)"
}

# Check max response time
if ($MaxTime -gt 2000) {
    Print-Fail "Max response time too high (${MaxTime}ms, target: <2000ms)"
    $Issues++
} else {
    Print-Pass "Max response time acceptable (${MaxTime}ms)"
}

# ═══════════════════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════════════════

Print-Header "LOAD TEST SUMMARY"

Write-Host "=== Test Configuration ===" -ForegroundColor $InfoColor
Write-Host "  Users: $Users"
Write-Host "  Duration: ${Duration}s"
Write-Host "  API URL: $ApiUrl"
Write-Host ""

Write-Host "=== Test Results ===" -ForegroundColor 'Magenta'
Write-Host "  Total Requests: $TotalRequests"
Write-Host "  Success Rate: ${SuccessRate}%"
Write-Host "  Error Rate: ${ErrorRate}%"
Write-Host "  Throughput: ${RequestsPerSec} req/sec"
Write-Host ""

Write-Host "=== Performance Metrics ===" -ForegroundColor 'Magenta'
Write-Host "  Average Response Time: ${AvgTime}ms"
Write-Host "  Min Response Time: ${MinTime}ms"
Write-Host "  Max Response Time: ${MaxTime}ms"
Write-Host ""

Write-Host "=== Assessment ===" -ForegroundColor 'Magenta'
if ($Issues -eq 0) {
    Print-Pass "✓ Load test PASSED - All metrics within acceptable ranges"
    Write-Host ""
    exit 0
} else {
    Print-Fail "✗ Load test FAILED - $Issues issue(s) found"
    Write-Host ""
    exit 1
}
