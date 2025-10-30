#!/bin/bash
set -e

# ==============================================
# ESLint Override Count Gate
# ==============================================
# This script prevents regression by failing CI
# if the number of eslint-disable comments grows
# beyond an acceptable threshold.
#
# Usage:
#   MAX_SDK_DISABLES=10 bash scripts/check-eslint-overrides.sh
#
# Environment Variables:
#   MAX_SDK_DISABLES - Maximum allowed disables in SDK files (default: 20)
#   MAX_TOTAL_DISABLES - Maximum allowed disables total (default: 50)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Thresholds
MAX_SDK_DISABLES=${MAX_SDK_DISABLES:-20}
MAX_TOTAL_DISABLES=${MAX_TOTAL_DISABLES:-50}

echo "🔍 Checking ESLint override count..."
echo ""

# Count disables in SDK files
SDK_COUNT=$(git grep -n "eslint-disable" src/lib/sdk 2>/dev/null | wc -l | tr -d ' ')
echo "SDK disables: $SDK_COUNT / $MAX_SDK_DISABLES"

# Count total disables
TOTAL_COUNT=$(git grep -n "eslint-disable" src 2>/dev/null | wc -l | tr -d ' ')
echo "Total disables: $TOTAL_COUNT / $MAX_TOTAL_DISABLES"
echo ""

# Check SDK threshold
if [ "$SDK_COUNT" -gt "$MAX_SDK_DISABLES" ]; then
  echo -e "${RED}❌ FAIL: Too many eslint disables in SDKs ($SDK_COUNT > $MAX_SDK_DISABLES)${NC}"
  echo ""
  echo "This indicates growing technical debt. Please:"
  echo "1. Refactor code to use toError() helper instead of unsafe operations"
  echo "2. Create DTOs with Zod validation instead of using raw DB types"
  echo "3. Use line-level disables with justifications only when absolutely necessary"
  echo ""
  echo "Files with disables:"
  git grep -l "eslint-disable" src/lib/sdk | sed 's/^/  - /'
  exit 1
fi

# Check total threshold
if [ "$TOTAL_COUNT" -gt "$MAX_TOTAL_DISABLES" ]; then
  echo -e "${RED}❌ FAIL: Too many total eslint disables ($TOTAL_COUNT > $MAX_TOTAL_DISABLES)${NC}"
  echo ""
  echo "Please review and reduce eslint-disable usage across the codebase."
  exit 1
fi

echo -e "${GREEN}✅ PASS: ESLint override count within acceptable limits${NC}"
exit 0
