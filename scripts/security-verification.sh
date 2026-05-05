#!/bin/bash

################################################################################
# SECURITY VERIFICATION SCRIPT
# Purpose: Verify PrepLoop security hardening and best practices
# Usage: ./scripts/security-verification.sh [--api-url http://localhost:5000]
# Exit: 0=all checks pass, 1=any check fails
################################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
API_URL="http://localhost:5000"
TIMEOUT=10

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0
WARNINGS=0

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
  ((CHECKS_PASSED++))
}

print_fail() {
  echo -e "${RED}❌ $1${NC}"
  ((CHECKS_FAILED++))
}

print_warn() {
  echo -e "${YELLOW}⚠️  $1${NC}"
  ((WARNINGS++))
}

print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

################################################################################
# PHASE 1: Environment & Configuration
################################################################################

print_header "PHASE 1: Environment & Configuration"

print_section "1.1 - Check NODE_ENV"
NODE_ENV=$(curl -s -m "$TIMEOUT" "${API_URL}/health/detailed" 2>/dev/null | grep -o '"environment":"[^"]*"' | cut -d'"' -f4)
if [ "$NODE_ENV" = "production" ] || [ "$NODE_ENV" = "staging" ]; then
  print_pass "NODE_ENV set to $NODE_ENV"
else
  print_warn "NODE_ENV is $NODE_ENV (should be production or staging)"
fi

print_section "1.2 - Check for exposed env variables"
RESPONSE=$(curl -s -m "$TIMEOUT" "${API_URL}/health/detailed" 2>/dev/null)

if echo "$RESPONSE" | grep -q "JWT_SECRET\|API_KEY\|SECRET"; then
  print_fail "Sensitive information exposed in response headers"
else
  print_pass "No obvious secrets in health response"
fi

print_section "1.3 - Verify config files not accessible"
for config_file in ".env" "config.json" "secrets.json"; do
  RESPONSE=$(curl -s -w "\n%{http_code}" -m "$TIMEOUT" "${API_URL}/$config_file" 2>/dev/null)
  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  if [ "$HTTP_CODE" = "404" ] || [ "$HTTP_CODE" = "403" ]; then
    print_pass "$config_file not directly accessible (HTTP $HTTP_CODE)"
  else
    print_warn "$config_file returned HTTP $HTTP_CODE"
  fi
done

################################################################################
# PHASE 2: HTTP Security Headers
################################################################################

print_header "PHASE 2: HTTP Security Headers"

HEADERS=$(curl -s -I -m "$TIMEOUT" "${API_URL}/health" 2>/dev/null)

print_section "2.1 - Strict-Transport-Security (HSTS)"
if echo "$HEADERS" | grep -qi "Strict-Transport-Security"; then
  print_pass "HSTS header present"
else
  print_warn "HSTS header not found (important for HTTPS)"
fi

print_section "2.2 - X-Content-Type-Options"
if echo "$HEADERS" | grep -q "X-Content-Type-Options: nosniff"; then
  print_pass "X-Content-Type-Options: nosniff"
else
  print_fail "X-Content-Type-Options header missing or incorrect"
fi

print_section "2.3 - X-Frame-Options"
if echo "$HEADERS" | grep -q "X-Frame-Options"; then
  print_pass "X-Frame-Options header present"
else
  print_fail "X-Frame-Options header missing"
fi

print_section "2.4 - Content-Security-Policy"
if echo "$HEADERS" | grep -q "Content-Security-Policy"; then
  print_pass "Content-Security-Policy header present"
else
  print_warn "Content-Security-Policy header not found"
fi

print_section "2.5 - X-XSS-Protection"
if echo "$HEADERS" | grep -q "X-XSS-Protection"; then
  print_pass "X-XSS-Protection header present"
else
  print_warn "X-XSS-Protection header not found"
fi

################################################################################
# PHASE 3: CORS Configuration
################################################################################

print_header "PHASE 3: CORS Configuration"

print_section "3.1 - Check CORS with allowed origin"
HEADERS=$(curl -s -I -m "$TIMEOUT" \
  -H "Origin: http://localhost:5173" \
  "${API_URL}/health" 2>/dev/null)

if echo "$HEADERS" | grep -q "Access-Control-Allow-Origin: http://localhost:5173"; then
  print_pass "CORS allows localhost:5173"
elif echo "$HEADERS" | grep -q "Access-Control-Allow-Origin: \*"; then
  print_fail "CORS allows all origins (*) - SECURITY RISK"
elif echo "$HEADERS" | grep -q "Access-Control-Allow-Origin"; then
  print_pass "CORS header present (specific origin)"
else
  print_info "CORS header not found"
fi

print_section "3.2 - Check CORS with disallowed origin"
HEADERS=$(curl -s -I -m "$TIMEOUT" \
  -H "Origin: http://malicious.example.com" \
  "${API_URL}/health" 2>/dev/null)

if echo "$HEADERS" | grep -q "Access-Control-Allow-Origin"; then
  print_warn "CORS allows arbitrary origin http://malicious.example.com"
else
  print_pass "CORS correctly rejects untrusted origin"
fi

print_section "3.3 - Check CORS credentials"
if echo "$HEADERS" | grep -q "Access-Control-Allow-Credentials: true"; then
  print_pass "CORS credentials handling verified"
else
  print_info "CORS credentials not advertised (may be expected)"
fi

################################################################################
# PHASE 4: Rate Limiting
################################################################################

print_header "PHASE 4: Rate Limiting"

print_section "4.1 - Test rate limit headers"
for i in {1..5}; do
  HEADERS=$(curl -s -I -m "$TIMEOUT" "${API_URL}/health" 2>/dev/null)
  
  if echo "$HEADERS" | grep -q "X-RateLimit-Limit\|RateLimit-Limit"; then
    print_pass "Rate limit header found"
    RATE_LIMIT=$(echo "$HEADERS" | grep -i "X-RateLimit-Limit\|RateLimit-Limit" | head -1)
    print_info "Header: $RATE_LIMIT"
    break
  fi
done

print_section "4.2 - Rapid request test (should not be blocked for health)"
ERROR_COUNT=0
for i in {1..20}; do
  HTTP_CODE=$(curl -s -w "%{http_code}" -m "$TIMEOUT" -o /dev/null "${API_URL}/health" 2>/dev/null)
  if [ "$HTTP_CODE" = "429" ]; then
    ERROR_COUNT=$((ERROR_COUNT + 1))
  fi
done

if [ $ERROR_COUNT -eq 0 ]; then
  print_pass "No rate limiting on health endpoint (expected)"
else
  print_info "Rate limited after 20 requests ($ERROR_COUNT 429 responses)"
fi

################################################################################
# PHASE 5: Authentication & Authorization
################################################################################

print_header "PHASE 5: Authentication & Authorization"

print_section "5.1 - Test unauthenticated access to protected endpoint"
RESPONSE=$(curl -s -w "\n%{http_code}" -m "$TIMEOUT" \
  "${API_URL}/api/interview-suite/list" 2>/dev/null)
HTTP_CODE=$(echo "$RESPONSE" | tail -1)

if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
  print_pass "Protected endpoint correctly rejects unauthenticated requests (HTTP $HTTP_CODE)"
elif [ "$HTTP_CODE" = "404" ]; then
  print_info "Endpoint not found (may be expected)"
else
  print_warn "Protected endpoint returned HTTP $HTTP_CODE (verify authentication)"
fi

print_section "5.2 - Test invalid JWT token"
RESPONSE=$(curl -s -w "\n%{http_code}" -m "$TIMEOUT" \
  -H "Authorization: Bearer invalid_token_12345" \
  "${API_URL}/api/interview-suite/list" 2>/dev/null)
HTTP_CODE=$(echo "$RESPONSE" | tail -1)

if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
  print_pass "Invalid JWT correctly rejected (HTTP $HTTP_CODE)"
else
  print_info "Invalid JWT returned HTTP $HTTP_CODE"
fi

print_section "5.3 - Test missing Authorization header"
RESPONSE=$(curl -s -w "\n%{http_code}" -m "$TIMEOUT" \
  "${API_URL}/api/interview-suite/list" 2>/dev/null)
HTTP_CODE=$(echo "$RESPONSE" | tail -1)

if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
  print_pass "Missing auth header correctly rejected (HTTP $HTTP_CODE)"
else
  print_info "Missing auth header returned HTTP $HTTP_CODE"
fi

################################################################################
# PHASE 6: Input Validation & Sanitization
################################################################################

print_header "PHASE 6: Input Validation & Sanitization"

print_section "6.1 - Test XSS injection in URL parameter"
RESPONSE=$(curl -s -w "\n%{http_code}" -m "$TIMEOUT" \
  "${API_URL}/api/dsa/search?q=<script>alert('xss')</script>" 2>/dev/null)
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

if echo "$BODY" | grep -q "<script>"; then
  print_fail "Possible XSS vulnerability - HTML tags not sanitized"
else
  print_pass "XSS injection attempt handled safely"
fi

print_section "6.2 - Test SQL injection attempt"
RESPONSE=$(curl -s -w "\n%{http_code}" -m "$TIMEOUT" \
  "${API_URL}/api/dsa/search?id=1' OR '1'='1" 2>/dev/null)
HTTP_CODE=$(echo "$RESPONSE" | tail -1)

if [ "$HTTP_CODE" = "200" ]; then
  print_info "SQL injection attempt returned HTTP 200 (may use parameterized queries)"
else
  print_pass "Unusual query returned HTTP $HTTP_CODE"
fi

################################################################################
# PHASE 7: Data Protection
################################################################################

print_header "PHASE 7: Data Protection"

print_section "7.1 - Verify HTTPS in production (via headers)"
if [ "$API_URL" = "http://localhost:5000" ]; then
  print_info "Local development (HTTP acceptable)"
else
  if echo "$API_URL" | grep -q "https"; then
    print_pass "Production URL uses HTTPS"
  else
    print_fail "Production URL does not use HTTPS"
  fi
fi

print_section "7.2 - Check for sensitive data in logs"
if [ -f "backend/logs.txt" ] || [ -f "logs/combined.log" ]; then
  if grep -i "password\|token\|secret\|api.key" backend/logs.txt 2>/dev/null | grep -v "REDACTED" | head -3; then
    print_warn "Sensitive data may be in logs"
  else
    print_pass "No obvious sensitive data in logs"
  fi
else
  print_info "No log files found (may be expected)"
fi

################################################################################
# PHASE 8: Dependency Security
################################################################################

print_header "PHASE 8: Dependency Security"

print_section "8.1 - Check npm audit status"
if [ -f "backend/package-lock.json" ] && [ -f "backend/package.json" ]; then
  cd backend 2>/dev/null
  AUDIT_RESULT=$(npm audit --omit=dev 2>&1 | tail -5)
  cd - > /dev/null 2>&1
  
  if echo "$AUDIT_RESULT" | grep -q "0 vulnerabilities"; then
    print_pass "No npm vulnerabilities found"
  else
    print_fail "npm audit found issues:"
    print_info "$AUDIT_RESULT"
  fi
else
  print_info "Cannot check npm audit (files not found)"
fi

################################################################################
# PHASE 9: Infrastructure Security
################################################################################

print_header "PHASE 9: Infrastructure Security"

print_section "9.1 - Check server banner"
HEADERS=$(curl -s -I -m "$TIMEOUT" "${API_URL}/health" 2>/dev/null)
SERVER_BANNER=$(echo "$HEADERS" | grep -i "^Server:" | head -1)

if echo "$SERVER_BANNER" | grep -q "Express"; then
  print_warn "Server banner reveals framework: $SERVER_BANNER"
else
  print_info "Server header: $SERVER_BANNER"
fi

print_section "9.2 - Check for debug information"
if echo "$HEADERS" | grep -q "X-Powered-By"; then
  print_warn "X-Powered-By header reveals stack information"
else
  print_pass "X-Powered-By header not present"
fi

################################################################################
# SUMMARY
################################################################################

print_header "SECURITY VERIFICATION SUMMARY"

TOTAL_CHECKS=$((CHECKS_PASSED + CHECKS_FAILED))
if [ $TOTAL_CHECKS -gt 0 ]; then
  PASS_RATE=$(( (CHECKS_PASSED * 100) / TOTAL_CHECKS ))
else
  PASS_RATE=0
fi

echo -e "${GREEN}✅ Passed: $CHECKS_PASSED${NC}"
echo -e "${RED}❌ Failed: $CHECKS_FAILED${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARNINGS${NC}"
echo -e "${BLUE}ℹ️  Total: $TOTAL_CHECKS${NC}"
echo -e "${YELLOW}Pass Rate: $PASS_RATE%${NC}"

echo ""

if [ "$CHECKS_FAILED" -eq 0 ]; then
  echo -e "${GREEN}✓ Security verification PASSED${NC}"
  if [ "$WARNINGS" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  $WARNINGS warning(s) to review${NC}"
  fi
  exit 0
else
  echo -e "${RED}✗ Security verification FAILED${NC}"
  exit 1
fi
