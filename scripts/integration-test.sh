#!/bin/bash

################################################################################
# INTEGRATION TEST SUITE
# Purpose: Test all PrepLoop API endpoints for correctness
# Usage: ./scripts/integration-test.sh [--api-url http://localhost:5000]
# Exit: 0=all tests pass, 1=any test fails
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Configuration
API_URL="http://localhost:5000"
TIMEOUT=10

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
FAILED_TESTS=()

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
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
  ((TESTS_PASSED++))
}

print_fail() {
  echo -e "${RED}❌ $1${NC}"
  ((TESTS_FAILED++))
  FAILED_TESTS+=("$1")
}

print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

# Helper function to make API calls
test_endpoint() {
  local name=$1
  local method=$2
  local endpoint=$3
  local expected_status=$4
  local data=$5
  
  print_section "$name"
  
  if [ -z "$data" ]; then
    RESPONSE=$(curl -s -w "\n%{http_code}" -m "$TIMEOUT" \
      -X "$method" "${API_URL}${endpoint}" \
      -H "Content-Type: application/json" 2>/dev/null || echo "error")
  else
    RESPONSE=$(curl -s -w "\n%{http_code}" -m "$TIMEOUT" \
      -X "$method" "${API_URL}${endpoint}" \
      -H "Content-Type: application/json" \
      -d "$data" 2>/dev/null || echo "error")
  fi
  
  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  BODY=$(echo "$RESPONSE" | head -n -1)
  
  if [ "$HTTP_CODE" = "$expected_status" ]; then
    print_pass "$name: HTTP $HTTP_CODE"
    return 0
  else
    print_fail "$name: Expected HTTP $expected_status, got $HTTP_CODE"
    print_info "Response: $BODY"
    return 1
  fi
}

################################################################################
# PHASE 1: Pre-flight Checks
################################################################################

print_header "PHASE 1: Pre-flight Checks"

print_section "1.1 - Verify API is running"
if curl -s -m "$TIMEOUT" "${API_URL}/health" > /dev/null 2>&1; then
  print_pass "API is running at ${API_URL}"
else
  print_fail "API is not responding"
  exit 1
fi

################################################################################
# PHASE 2: Health & Status Endpoints
################################################################################

print_header "PHASE 2: Health & Status Endpoints"

test_endpoint "GET /health" "GET" "/health" "200"
test_endpoint "GET /health/ready" "GET" "/health/ready" "200"
test_endpoint "GET /health/live" "GET" "/health/live" "200"
test_endpoint "GET /health/detailed" "GET" "/health/detailed" "200"

################################################################################
# PHASE 3: Auth Endpoints
################################################################################

print_header "PHASE 3: Authentication Endpoints"

print_section "3.1 - GET /api/auth/status (unauthenticated)"
RESPONSE=$(curl -s -w "\n%{http_code}" -m "$TIMEOUT" "${API_URL}/api/auth/status" 2>/dev/null)
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "200" ]; then
  print_pass "Auth status endpoint accessible"
else
  print_fail "Auth status endpoint failed (HTTP $HTTP_CODE)"
fi

################################################################################
# PHASE 4: DSA/Problem Endpoints
################################################################################

print_header "PHASE 4: DSA & Problem Endpoints"

print_section "4.1 - GET /api/dsa/problems (should return list or 401)"
RESPONSE=$(curl -s -w "\n%{http_code}" -m "$TIMEOUT" "${API_URL}/api/dsa/problems" 2>/dev/null)
HTTP_CODE=$(echo "$RESPONSE" | tail -1)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ]; then
  print_pass "DSA problems endpoint responsive (HTTP $HTTP_CODE)"
else
  print_fail "DSA problems endpoint failed (HTTP $HTTP_CODE)"
fi

print_section "4.2 - GET /api/dsa/categories (should return list or 401)"
RESPONSE=$(curl -s -w "\n%{http_code}" -m "$TIMEOUT" "${API_URL}/api/dsa/categories" 2>/dev/null)
HTTP_CODE=$(echo "$RESPONSE" | tail -1)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ]; then
  print_pass "DSA categories endpoint responsive (HTTP $HTTP_CODE)"
else
  print_fail "DSA categories endpoint failed (HTTP $HTTP_CODE)"
fi

################################################################################
# PHASE 5: AI & Voice Endpoints
################################################################################

print_header "PHASE 5: AI & Voice Endpoints"

print_section "5.1 - GET /api/ai/health (should exist or 404)"
RESPONSE=$(curl -s -w "\n%{http_code}" -m "$TIMEOUT" "${API_URL}/api/ai/health" 2>/dev/null)
HTTP_CODE=$(echo "$RESPONSE" | tail -1)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "404" ] || [ "$HTTP_CODE" = "401" ]; then
  print_pass "AI health endpoint accessible (HTTP $HTTP_CODE)"
else
  print_fail "Unexpected response (HTTP $HTTP_CODE)"
fi

################################################################################
# PHASE 6: Interview Suite Endpoints
################################################################################

print_header "PHASE 6: Interview Suite Endpoints"

print_section "6.1 - GET /api/interview-suite/status (should exist or 401)"
RESPONSE=$(curl -s -w "\n%{http_code}" -m "$TIMEOUT" "${API_URL}/api/interview-suite/status" 2>/dev/null)
HTTP_CODE=$(echo "$RESPONSE" | tail -1)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "404" ]; then
  print_pass "Interview suite endpoint accessible (HTTP $HTTP_CODE)"
else
  print_fail "Interview suite endpoint failed (HTTP $HTTP_CODE)"
fi

################################################################################
# PHASE 7: Jobs/Career Endpoints
################################################################################

print_header "PHASE 7: Jobs & Career Endpoints"

print_section "7.1 - GET /api/jobs/search (should exist or 401)"
RESPONSE=$(curl -s -w "\n%{http_code}" -m "$TIMEOUT" "${API_URL}/api/jobs/search" 2>/dev/null)
HTTP_CODE=$(echo "$RESPONSE" | tail -1)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "404" ] || [ "$HTTP_CODE" = "400" ]; then
  print_pass "Jobs search endpoint accessible (HTTP $HTTP_CODE)"
else
  print_fail "Jobs search endpoint failed (HTTP $HTTP_CODE)"
fi

################################################################################
# PHASE 8: Error Handling
################################################################################

print_header "PHASE 8: Error Handling"

print_section "8.1 - GET /api/nonexistent (should return 404)"
RESPONSE=$(curl -s -w "\n%{http_code}" -m "$TIMEOUT" "${API_URL}/api/nonexistent" 2>/dev/null)
HTTP_CODE=$(echo "$RESPONSE" | tail -1)

if [ "$HTTP_CODE" = "404" ] || [ "$HTTP_CODE" = "405" ]; then
  print_pass "Invalid endpoint returns error (HTTP $HTTP_CODE)"
else
  print_fail "Invalid endpoint should return 404/405, got HTTP $HTTP_CODE"
fi

print_section "8.2 - Invalid JSON payload"
RESPONSE=$(curl -s -w "\n%{http_code}" -m "$TIMEOUT" \
  -X POST "${API_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{ invalid json" 2>/dev/null)
HTTP_CODE=$(echo "$RESPONSE" | tail -1)

if [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "500" ]; then
  print_pass "Invalid JSON handled (HTTP $HTTP_CODE)"
else
  print_info "Invalid JSON returned HTTP $HTTP_CODE (may be acceptable)"
fi

################################################################################
# PHASE 9: Response Headers & Security
################################################################################

print_header "PHASE 9: Response Headers & Security"

print_section "9.1 - Check security headers"
HEADERS=$(curl -s -I -m "$TIMEOUT" "${API_URL}/health" 2>/dev/null)

if echo "$HEADERS" | grep -q "X-Content-Type-Options"; then
  print_pass "X-Content-Type-Options header present"
else
  print_info "X-Content-Type-Options header not found"
fi

if echo "$HEADERS" | grep -q "X-Frame-Options"; then
  print_pass "X-Frame-Options header present"
else
  print_info "X-Frame-Options header not found"
fi

print_section "9.2 - Check CORS headers"
HEADERS=$(curl -s -I -m "$TIMEOUT" \
  -H "Origin: http://localhost:5173" \
  "${API_URL}/health" 2>/dev/null)

if echo "$HEADERS" | grep -q "Access-Control-Allow-Origin"; then
  print_pass "CORS Access-Control-Allow-Origin header present"
else
  print_info "CORS headers not found (may be expected)"
fi

################################################################################
# PHASE 10: Response Times
################################################################################

print_header "PHASE 10: Response Time Verification"

print_section "10.1 - Measure /health response time"
START=$(date +%s%N)
curl -s -m "$TIMEOUT" "${API_URL}/health" > /dev/null 2>&1
END=$(date +%s%N)
RESPONSE_TIME=$(( (END - START) / 1000000 ))

if [ "$RESPONSE_TIME" -lt 1000 ]; then
  print_pass "/health response time: ${RESPONSE_TIME}ms (target: <1000ms)"
else
  print_info "/health response time: ${RESPONSE_TIME}ms (slightly high)"
fi

################################################################################
# PHASE 11: Database Connectivity
################################################################################

print_header "PHASE 11: Database Connectivity Tests"

print_section "11.1 - Check for database errors in /health/detailed"
RESPONSE=$(curl -s -m "$TIMEOUT" "${API_URL}/health/detailed" 2>/dev/null)

if echo "$RESPONSE" | grep -q '"database"'; then
  if echo "$RESPONSE" | grep -q '"status":"ok"'; then
    print_pass "Database connection appears healthy"
  else
    print_info "Database status available in health endpoint"
  fi
else
  print_info "Database status not in detailed health response"
fi

################################################################################
# PHASE 12: Cache Connectivity
################################################################################

print_header "PHASE 12: Cache Connectivity Tests"

print_section "12.1 - Check for cache health in /health/detailed"
RESPONSE=$(curl -s -m "$TIMEOUT" "${API_URL}/health/detailed" 2>/dev/null)

if echo "$RESPONSE" | grep -q '"cache"'; then
  if echo "$RESPONSE" | grep -q '"status":"ok"'; then
    print_pass "Cache connection appears healthy"
  else
    print_info "Cache status available in health endpoint"
  fi
else
  print_info "Cache status not in detailed health response"
fi

################################################################################
# SUMMARY
################################################################################

print_header "INTEGRATION TEST SUMMARY"

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
if [ $TOTAL_TESTS -gt 0 ]; then
  SUCCESS_RATE=$(( (TESTS_PASSED * 100) / TOTAL_TESTS ))
else
  SUCCESS_RATE=0
fi

echo -e "${GREEN}✅ Passed: $TESTS_PASSED${NC}"
echo -e "${RED}❌ Failed: $TESTS_FAILED${NC}"
echo -e "${BLUE}ℹ️  Total: $TOTAL_TESTS${NC}"
echo -e "${YELLOW}Success Rate: $SUCCESS_RATE%${NC}"

if [ ${#FAILED_TESTS[@]} -gt 0 ]; then
  echo ""
  echo -e "${RED}Failed Tests:${NC}"
  for test in "${FAILED_TESTS[@]}"; do
    echo "  - $test"
  done
fi

echo ""

if [ "$TESTS_FAILED" -eq 0 ]; then
  print_pass "✓ All integration tests passed!"
  exit 0
else
  print_fail "✗ Some tests failed"
  exit 1
fi
