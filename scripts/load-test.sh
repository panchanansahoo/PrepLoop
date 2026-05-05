#!/bin/bash

################################################################################
# LOAD TESTING SCRIPT
# Purpose: Test PrepLoop backend under concurrent load (100-1000 users)
# Usage: ./scripts/load-test.sh [--users 100] [--duration 60] [--api-url http://localhost:5000]
# Exit: 0=success, 1=failure
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
NUM_USERS=100
DURATION=60
API_URL="http://localhost:5000"
RAMP_UP_TIME=10
RESULTS_FILE="/tmp/load-test-results-$(date +%s).txt"

# Counters
TOTAL_REQUESTS=0
SUCCESSFUL_REQUESTS=0
FAILED_REQUESTS=0
TOTAL_TIME=0
MIN_TIME=999999
MAX_TIME=0

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --users)
      NUM_USERS=$2
      shift 2
      ;;
    --duration)
      DURATION=$2
      shift 2
      ;;
    --api-url)
      API_URL=$2
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

print_header() {
  echo ""
  echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║${NC}  $1"
  echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
  echo ""
}

print_section() {
  echo -e "${YELLOW}▶ $1${NC}"
}

print_pass() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_fail() {
  echo -e "${RED}❌ $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

print_metric() {
  echo -e "${MAGENTA}📊 $1${NC}"
}

################################################################################
# PHASE 1: Pre-flight Checks
################################################################################

print_header "PHASE 1: Pre-flight Checks"

print_section "1.1 - Check if API is reachable"
if curl -s -m 5 "${API_URL}/health" > /dev/null 2>&1; then
  print_pass "API is reachable at ${API_URL}"
else
  print_fail "API is not reachable at ${API_URL}"
  exit 1
fi

print_section "1.2 - Check if API is healthy"
HEALTH_STATUS=$(curl -s -m 5 "${API_URL}/health" 2>/dev/null | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
if [ "$HEALTH_STATUS" = "ok" ] || [ -n "$HEALTH_STATUS" ]; then
  print_pass "API health check passed (status: $HEALTH_STATUS)"
else
  print_fail "API health check failed"
  exit 1
fi

print_section "1.3 - Verify load test parameters"
print_info "Users: $NUM_USERS"
print_info "Duration: ${DURATION}s"
print_info "Ramp-up time: ${RAMP_UP_TIME}s"
print_info "Target URL: ${API_URL}/health"

################################################################################
# PHASE 2: Simulate Load
################################################################################

print_header "PHASE 2: Simulating Load"

print_section "2.1 - Starting load test"
echo "Time,Elapsed(ms),Status,ResponseTime(ms)" > "$RESULTS_FILE"

# Calculate requests per second for gradual ramp-up
REQUESTS_PER_SECOND=$((NUM_USERS / RAMP_UP_TIME))

print_info "Ramping up: $REQUESTS_PER_SECOND requests/sec during first ${RAMP_UP_TIME}s"
print_info "Writing results to: $RESULTS_FILE"
echo ""

START_TIME=$(date +%s%N)
ELAPSED_TIME=0
CURRENT_PARALLEL=0
REQUEST_COUNT=0

while [ $ELAPSED_TIME -lt $((DURATION * 1000000000)) ]; do
  CURRENT_TIME=$(date +%s%N)
  ELAPSED_TIME=$((CURRENT_TIME - START_TIME))
  ELAPSED_SECONDS=$((ELAPSED_TIME / 1000000000))
  
  # Calculate current number of parallel requests (ramp-up phase)
  if [ $ELAPSED_SECONDS -lt $RAMP_UP_TIME ]; then
    CURRENT_PARALLEL=$(( (ELAPSED_SECONDS * NUM_USERS) / RAMP_UP_TIME ))
  else
    CURRENT_PARALLEL=$NUM_USERS
  fi
  
  # Submit requests up to current parallel level
  while [ $REQUEST_COUNT -lt $CURRENT_PARALLEL ]; do
    (
      REQ_START=$(date +%s%N)
      
      # Make request
      HTTP_CODE=$(curl -s -w "\n%{http_code}" -m 10 "${API_URL}/health" 2>/dev/null | tail -1)
      
      REQ_END=$(date +%s%N)
      RESPONSE_TIME=$(( (REQ_END - REQ_START) / 1000000 ))
      
      # Record result
      {
        echo "$(date +%H:%M:%S),$ELAPSED_TIME,$HTTP_CODE,$RESPONSE_TIME"
      } >> "$RESULTS_FILE"
      
      # Update counters
      if [ "$HTTP_CODE" = "200" ]; then
        echo "." >&2
      else
        echo "✗" >&2
      fi
    ) &
    
    REQUEST_COUNT=$((REQUEST_COUNT + 1))
  done
  
  # Progress indicator
  if [ $((ELAPSED_SECONDS % 5)) -eq 0 ] && [ $ELAPSED_SECONDS -gt 0 ]; then
    ACTIVE_JOBS=$(jobs -r | wc -l)
    print_metric "Progress: ${ELAPSED_SECONDS}/${DURATION}s | Active connections: $ACTIVE_JOBS | Total requests: $REQUEST_COUNT"
  fi
  
  sleep 0.1
done

# Wait for all background jobs to complete
print_section "2.2 - Waiting for all requests to complete..."
wait

print_pass "Load test completed"

################################################################################
# PHASE 3: Analyze Results
################################################################################

print_header "PHASE 3: Analyzing Results"

# Read results file and calculate metrics
if [ -f "$RESULTS_FILE" ]; then
  # Skip header line
  tail -n +2 "$RESULTS_FILE" | while IFS=',' read -r time elapsed status response_time; do
    TOTAL_REQUESTS=$((TOTAL_REQUESTS + 1))
    
    if [ "$status" = "200" ]; then
      SUCCESSFUL_REQUESTS=$((SUCCESSFUL_REQUESTS + 1))
    else
      FAILED_REQUESTS=$((FAILED_REQUESTS + 1))
    fi
    
    TOTAL_TIME=$((TOTAL_TIME + response_time))
    
    if [ "$response_time" -lt "$MIN_TIME" ]; then
      MIN_TIME=$response_time
    fi
    
    if [ "$response_time" -gt "$MAX_TIME" ]; then
      MAX_TIME=$response_time
    fi
  done
fi

# Calculate metrics
if [ $TOTAL_REQUESTS -gt 0 ]; then
  AVG_TIME=$((TOTAL_TIME / TOTAL_REQUESTS))
  SUCCESS_RATE=$(( (SUCCESSFUL_REQUESTS * 100) / TOTAL_REQUESTS ))
  ERROR_RATE=$(( (FAILED_REQUESTS * 100) / TOTAL_REQUESTS ))
  REQUESTS_PER_SEC=$(( (TOTAL_REQUESTS * 1000) / DURATION ))
else
  AVG_TIME=0
  SUCCESS_RATE=0
  ERROR_RATE=0
  REQUESTS_PER_SEC=0
fi

print_section "3.1 - Request Statistics"
print_metric "Total Requests: $TOTAL_REQUESTS"
print_metric "Successful: $SUCCESSFUL_REQUESTS (${SUCCESS_RATE}%)"
print_metric "Failed: $FAILED_REQUESTS (${ERROR_RATE}%)"
print_metric "Throughput: ${REQUESTS_PER_SEC} req/sec"

print_section "3.2 - Response Time Statistics"
print_metric "Average: ${AVG_TIME}ms"
print_metric "Min: ${MIN_TIME}ms"
print_metric "Max: ${MAX_TIME}ms"

# Calculate percentiles (simple approximation)
if [ $TOTAL_REQUESTS -gt 0 ]; then
  P95_INDEX=$(( (TOTAL_REQUESTS * 95) / 100 ))
  P99_INDEX=$(( (TOTAL_REQUESTS * 99) / 100 ))
  
  # Sort response times and get percentiles
  SORTED_TIMES=$(tail -n +2 "$RESULTS_FILE" | cut -d',' -f4 | sort -n)
  P95=$(echo "$SORTED_TIMES" | sed -n "${P95_INDEX}p")
  P99=$(echo "$SORTED_TIMES" | sed -n "${P99_INDEX}p")
  
  if [ -n "$P95" ]; then print_metric "P95: ${P95}ms"; fi
  if [ -n "$P99" ]; then print_metric "P99: ${P99}ms"; fi
fi

################################################################################
# PHASE 4: Performance Assessment
################################################################################

print_header "PHASE 4: Performance Assessment"

ISSUES=0

# Check response times
if [ "$AVG_TIME" -gt 500 ]; then
  print_fail "Average response time too high (${AVG_TIME}ms, target: <500ms)"
  ISSUES=$((ISSUES + 1))
else
  print_pass "Average response time acceptable (${AVG_TIME}ms)"
fi

# Check error rate
if [ "$ERROR_RATE" -gt 5 ]; then
  print_fail "Error rate too high (${ERROR_RATE}%, target: <5%)"
  ISSUES=$((ISSUES + 1))
else
  print_pass "Error rate acceptable (${ERROR_RATE}%)"
fi

# Check max response time
if [ "$MAX_TIME" -gt 2000 ]; then
  print_fail "Max response time too high (${MAX_TIME}ms, target: <2000ms)"
  ISSUES=$((ISSUES + 1))
else
  print_pass "Max response time acceptable (${MAX_TIME}ms)"
fi

# Check throughput
EXPECTED_THROUGHPUT=$(( (NUM_USERS * DURATION) / DURATION ))
if [ "$REQUESTS_PER_SEC" -lt $((EXPECTED_THROUGHPUT / 2)) ]; then
  print_fail "Throughput too low (${REQUESTS_PER_SEC} req/sec)"
  ISSUES=$((ISSUES + 1))
else
  print_pass "Throughput acceptable (${REQUESTS_PER_SEC} req/sec)"
fi

################################################################################
# SUMMARY
################################################################################

print_header "LOAD TEST SUMMARY"

echo -e "${BLUE}=== Test Configuration ===${NC}"
echo "  Users: $NUM_USERS"
echo "  Duration: ${DURATION}s"
echo "  API URL: ${API_URL}"
echo ""

echo -e "${MAGENTA}=== Test Results ===${NC}"
echo "  Total Requests: $TOTAL_REQUESTS"
echo "  Success Rate: ${SUCCESS_RATE}%"
echo "  Error Rate: ${ERROR_RATE}%"
echo "  Throughput: ${REQUESTS_PER_SEC} req/sec"
echo ""

echo -e "${MAGENTA}=== Performance Metrics ===${NC}"
echo "  Average Response Time: ${AVG_TIME}ms"
echo "  Min Response Time: ${MIN_TIME}ms"
echo "  Max Response Time: ${MAX_TIME}ms"
echo ""

echo -e "${MAGENTA}=== Assessment ===${NC}"
if [ $ISSUES -eq 0 ]; then
  print_pass "✓ Load test PASSED - All metrics within acceptable ranges"
  echo ""
  rm -f "$RESULTS_FILE"
  exit 0
else
  print_fail "✗ Load test FAILED - $ISSUES issue(s) found"
  echo ""
  print_info "Detailed results saved to: $RESULTS_FILE"
  echo ""
  exit 1
fi
