#!/bin/bash
set -euo pipefail

echo "🚀 AutoRentar - Complete Guardrails Setup"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if running from project root
if [ ! -f "package.json" ]; then
  echo -e "${RED}❌ Error: Must run from project root${NC}"
  exit 1
fi

# 1. Setup guardrails
echo ""
echo -e "${YELLOW}📦 Step 1/2: Installing guardrails...${NC}"
./scripts/setup-guardrails.sh || {
  echo -e "${RED}❌ Guardrails setup failed${NC}"
  exit 1
}

# 2. Migrate wallet RPCs (only if SUPABASE_DB_URL is set)
echo ""
if [ -n "${SUPABASE_DB_URL:-}" ]; then
  echo -e "${YELLOW}📦 Step 2/2: Migrating wallet RPCs...${NC}"
  ./scripts/migrate-wallet-rpcs.sh || {
    echo -e "${RED}❌ Migration failed${NC}"
    exit 1
  }
else
  echo -e "${YELLOW}⚠️  Step 2/2: Skipping migration (SUPABASE_DB_URL not set)${NC}"
  echo ""
  echo "To run migration later:"
  echo "  1. Set SUPABASE_DB_URL in .env"
  echo "  2. Run: ./scripts/migrate-wallet-rpcs.sh"
fi

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "📝 Summary:"
echo "  ✓ Husky hooks: pre-commit, pre-push"
echo "  ✓ GitHub Actions: contract tests on push"
if [ -n "${SUPABASE_DB_URL:-}" ]; then
  echo "  ✓ Wallet RPCs: hold, capture, release"
else
  echo "  ⚠ Wallet RPCs: skipped (set SUPABASE_DB_URL to migrate)"
fi
echo ""
echo "Next steps:"
echo "  1. Review changes: git status"
echo "  2. Commit: git add . && git commit -m 'feat: atomic wallet RPCs + guardrails'"
echo "  3. Test hooks: make a small change and commit again"
