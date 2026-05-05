#!/bin/bash

################################################################################
# STAGING DEPLOYMENT TEST
# Purpose: Verify PrepLoop backend can be deployed and operates correctly
# Usage: ./scripts/staging-deployment-test.sh [--build] [--no-cleanup]
# Exit: 0=success, 1=failure
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
STAGING_CONTAINER="preploop-staging-backend"
STAGING_PORT=5001
API_HEALTH_URL="http://localhost:${STAGING_PORT}/health"
API_READY_URL="http://localhost:${STAGING_PORT}/health/ready"
API_DETAILED_URL="http://localhost:${STAGING_PORT}/health/detailed"
TIMEOUT=10
MAX_RETRIES=30
CLEANUP=true
BUILD_ONLY=false
NO_CLEANUP=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --build)
      BUILD_ONLY=true
      shift
      ;;
    --no-cleanup)
      NO_CLEANUP=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0
FAILED_TESTS=()

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

cleanup_staging() {
  if [ "$NO_CLEANUP" = true ]; then
    print_info "Skipping cleanup (--no-cleanup flag set)"
    return
  fi
  
  print_section "Cleaning up staging container..."
  docker stop "$STAGING_CONTAINER" 2>/dev/null || true
  docker rm "$STAGING_CONTAINER" 2>/dev/null || true
  print_pass "Staging container stopped and removed"
}

################################################################################
# PHASE 1: Environment & Pre-flight Checks
################################################################################

print_header "PHASE 1: Environment & Pre-flight Checks"

print_section "1.1 - Check Docker availability"
if command -v docker &> /dev/null; then
  DOCKER_VERSION=$(docker --version)
  print_pass "Docker installed: $DOCKER_VERSION"
else
  print_fail "Docker is not installed"
  exit 1
fi

print_section "1.2 - Check environment variables"
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
  print_fail "Missing required environment variables (SUPABASE_URL, SUPABASE_ANON_KEY)"
  exit 1
else
  print_pass "Required environment variables present"
fi

print_section "1.3 - Check backend code structure"
if [ -f "backend/index.js" ] && [ -f "backend/package.json" ]; then
  print_pass "Backend code structure verified"
else
  print_fail "Backend code structure incomplete"
  exit 1
fi

print_section "1.4 - Check for secrets in code"
if grep -r "sk_" backend/ --include="*.js" 2>/dev/null | grep -v node_modules | grep -v ".test.js" | head -5; then
  print_fail "Potential secrets found in code"
  exit 1
else
  print_pass "No obvious secrets detected in code"
fi

################################################################################
# PHASE 2: Build Docker Image
################################################################################

print_header "PHASE 2: Build Docker Image"

print_section "2.1 - Build backend Docker image"
if docker build -t preploop-backend:staging -f Dockerfile --target backend .; then
  print_pass "Docker image built successfully"
else
  print_fail "Docker image build failed"
  exit 1
fi

if [ "$BUILD_ONLY" = true ]; then
  print_info "Build-only mode: exiting after image build"
  exit 0
fi

print_section "2.2 - Verify image exists"
if docker images | grep -q "preploop-backend.*staging"; then
  IMAGE_SIZE=$(docker images preploop-backend:staging --format "{{.Size}}")
  print_pass "Docker image verified (size: $IMAGE_SIZE)"
else
  print_fail "Docker image not found after build"
  exit 1
fi

################################################################################
# PHASE 3: Deploy to Staging
################################################################################

print_header "PHASE 3: Deploy to Staging Container"

# Clean up any existing staging container
cleanup_staging

print_section "3.1 - Start staging container"
if docker run -d \
  --name "$STAGING_CONTAINER" \
  -p "${STAGING_PORT}:5000" \
  -e NODE_ENV=staging \
  -e FRONTEND_URL=http://localhost:5173 \
  -e SUPABASE_URL="$SUPABASE_URL" \
  -e SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
  -e SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
  -e GROQ_API_KEY="$GROQ_API_KEY" \
  -e REDIS_URL="redis://host.docker.internal:6379" \
  preploop-backend:staging; then
  print_pass "Container started (ID: $(docker ps -q -f name=$STAGING_CONTAINER | head -c 12))"
else
  print_fail "Failed to start staging container"
  exit 1
fi

print_section "3.2 - Wait for container to be ready"
RETRIES=0
while [ $RETRIES -lt $MAX_RETRIES ]; do
  if docker logs "$STAGING_CONTAINER" 2>&1 | grep -q "listening\|Listening"; then
    print_pass "Container initialization detected"
    break
  fi
  RETRIES=$((RETRIES + 1))
  sleep 1
done

if [ $RETRIES -eq $MAX_RETRIES ]; then
  print_fail "Container failed to initialize within ${MAX_RETRIES}s"
  docker logs "$STAGING_CONTAINER" | tail -20
  cleanup_staging
  exit 1
fi

################################################################################
# PHASE 4: Health Endpoint Tests
################################################################################

print_header "PHASE 4: Health Endpoint Tests"

print_section "4.1 - Test basic health endpoint (/health)"
RESPONSE=$(curl -s -w "\n%{http_code}" -m "$TIMEOUT" "$API_HEALTH_URL" 2>/dev/null || echo "error")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
  print_pass "/health endpoint responsive (HTTP 200)"
  print_info "Response: $BODY"
else
  print_fail "/health endpoint failed (HTTP $HTTP_CODE)"
  print_info "Response: $BODY"
fi

print_section "4.2 - Test readiness probe (/health/ready)"
RESPONSE=$(curl -s -w "\n%{http_code}" -m "$TIMEOUT" "$API_READY_URL" 2>/dev/null || echo "error")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
  print_pass "/health/ready endpoint responsive (HTTP 200)"
  # Check for service status in response
  if echo "$BODY" | grep -q '"status":"ready"'; then
    print_pass "All services marked ready"
  else
    print_info "Ready endpoint response: $BODY"
  fi
else
  print_fail "/health/ready endpoint failed (HTTP $HTTP_CODE)"
fi

print_section "4.3 - Test detailed diagnostics (/health/detailed)"
RESPONSE=$(curl -s -w "\n%{http_code}" -m "$TIMEOUT" "$API_DETAILED_URL" 2>/dev/null || echo "error")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
  print_pass "/health/detailed endpoint responsive (HTTP 200)"
  # Extract key metrics
  if echo "$BODY" | grep -q "uptime"; then
    UPTIME=$(echo "$BODY" | grep -o '"uptime":[^,}]*' | cut -d':' -f2)
    print_info "Server uptime: ${UPTIME}s"
  fi
else
  print_fail "/health/detailed endpoint failed (HTTP $HTTP_CODE)"
fi

################################################################################
# PHASE 5: Smoke Tests (API Endpoints)
################################################################################

print_header "PHASE 5: Smoke Tests - API Endpoints"

print_section "5.1 - Test CORS headers"
RESPONSE=$(curl -s -I -m "$TIMEOUT" \
  -H "Origin: http://localhost:5173" \
  "http://localhost:${STAGING_PORT}/api/health" 2>/dev/null || echo "error")

if echo "$RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
  print_pass "CORS headers present"
else
  print_info "CORS headers not in response (may be expected)"
fi

print_section "5.2 - Test API response time"
START_TIME=$(date +%s%N)
curl -s -m "$TIMEOUT" "http://localhost:${STAGING_PORT}/health" > /dev/null 2>&1
END_TIME=$(date +%s%N)
RESPONSE_TIME=$(( (END_TIME - START_TIME) / 1000000 ))

if [ "$RESPONSE_TIME" -lt 1000 ]; then
  print_pass "API response time acceptable (${RESPONSE_TIME}ms)"
else
  print_info "API response time: ${RESPONSE_TIME}ms (threshold: 1000ms)"
fi

print_section "5.3 - Test error handling (invalid endpoint)"
RESPONSE=$(curl -s -w "\n%{http_code}" -m "$TIMEOUT" \
  "http://localhost:${STAGING_PORT}/api/nonexistent" 2>/dev/null || echo "error")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)

if [ "$HTTP_CODE" = "404" ]; then
  print_pass "Error handling correct (HTTP 404 for invalid endpoint)"
elif [ "$HTTP_CODE" = "200" ]; then
  print_fail "Invalid endpoint returned HTTP 200 (should be 404 or similar)"
else
  print_info "Invalid endpoint returned HTTP $HTTP_CODE"
fi

################################################################################
# PHASE 6: Container Health & Metrics
################################################################################

print_header "PHASE 6: Container Health & Metrics"

print_section "6.1 - Check container status"
if docker ps | grep -q "$STAGING_CONTAINER"; then
  STATUS=$(docker inspect --format='{{.State.Status}}' "$STAGING_CONTAINER")
  print_pass "Container status: $STATUS"
else
  print_fail "Container is not running"
  cleanup_staging
  exit 1
fi

print_section "6.2 - Check container resource usage"
STATS=$(docker stats --no-stream --format "{{.CPUPerc}}\t{{.MemUsage}}" "$STAGING_CONTAINER" 2>/dev/null)
if [ -n "$STATS" ]; then
  CPU=$(echo "$STATS" | awk '{print $1}')
  MEM=$(echo "$STATS" | awk '{print $2}')
  print_pass "CPU: $CPU | Memory: $MEM"
else
  print_info "Unable to retrieve container stats"
fi

print_section "6.3 - Check for error logs in container"
ERROR_COUNT=$(docker logs "$STAGING_CONTAINER" 2>&1 | grep -i "error\|failed\|exception" | wc -l)
if [ "$ERROR_COUNT" -eq 0 ]; then
  print_pass "No errors detected in container logs"
else
  print_info "Found $ERROR_COUNT error-like log entries (review with: docker logs $STAGING_CONTAINER)"
fi

print_section "6.4 - Verify database connection"
if docker logs "$STAGING_CONTAINER" 2>&1 | grep -iq "supabase\|database\|connected"; then
  print_pass "Database connection detected in logs"
else
  print_info "Database connection messages not found in logs"
fi

################################################################################
# PHASE 7: Rollback Test
################################################################################

print_header "PHASE 7: Rollback Test"

print_section "7.1 - Stop container (simulating rollback)"
if docker stop "$STAGING_CONTAINER"; then
  print_pass "Container stopped successfully"
else
  print_fail "Failed to stop container"
fi

print_section "7.2 - Verify container stopped"
sleep 2
if ! docker ps | grep -q "$STAGING_CONTAINER"; then
  print_pass "Container verified as stopped"
else
  print_fail "Container still running after stop command"
fi

print_section "7.3 - Restart container"
if docker start "$STAGING_CONTAINER"; then
  print_pass "Container restarted successfully"
  sleep 3
else
  print_fail "Failed to restart container"
fi

print_section "7.4 - Verify health after restart"
RESPONSE=$(curl -s -w "\n%{http_code}" -m "$TIMEOUT" "$API_HEALTH_URL" 2>/dev/null || echo "error")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)

if [ "$HTTP_CODE" = "200" ]; then
  print_pass "Container healthy after restart"
else
  print_fail "Container not healthy after restart (HTTP $HTTP_CODE)"
fi

################################################################################
# SUMMARY
################################################################################

print_header "TEST SUMMARY"

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
SUCCESS_RATE=$(( (TESTS_PASSED * 100) / TOTAL_TESTS ))

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

# Cleanup
print_section "Cleanup"
cleanup_staging

# Exit with appropriate code
if [ "$TESTS_FAILED" -eq 0 ]; then
  print_pass "All tests passed! Staging deployment verified ✓"
  echo ""
  exit 0
else
  print_fail "$TESTS_FAILED test(s) failed"
  echo ""
  exit 1
fi
