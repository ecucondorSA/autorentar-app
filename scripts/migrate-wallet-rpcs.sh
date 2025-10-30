#!/bin/bash
set -euo pipefail

echo "🚀 Migrating Wallet Atomic RPCs..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running from project root
if [ ! -f "package.json" ]; then
  echo -e "${RED}❌ Error: Must run from project root${NC}"
  exit 1
fi

# Validate env
if [ -z "${SUPABASE_DB_URL:-}" ]; then
  echo -e "${RED}❌ Error: SUPABASE_DB_URL not set${NC}"
  echo ""
  echo "Set it with:"
  echo "  export SUPABASE_DB_URL='postgresql://postgres.[PROJECT]:[PASSWORD]@aws-1-us-east-2.pooler.supabase.com:6543/postgres'"
  echo ""
  echo "Or create .env file with:"
  echo "  SUPABASE_DB_URL=postgresql://..."
  exit 1
fi

# Run migration
echo -e "${YELLOW}📝 Executing SQL migration...${NC}"
psql "$SUPABASE_DB_URL" -f supabase/migrations/20251030_wallet_atomic_rpcs.sql

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ SQL migration successful${NC}"
else
  echo -e "${RED}❌ SQL migration failed${NC}"
  exit 1
fi

# Regenerate types (optional - skip if types:gen script doesn't exist)
if grep -q '"types:gen"' package.json; then
  echo -e "${YELLOW}🔄 Regenerating TypeScript types...${NC}"
  pnpm types:gen

  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Types regenerated${NC}"
  else
    echo -e "${RED}❌ Type generation failed${NC}"
    exit 1
  fi
else
  echo -e "${YELLOW}⚠️  Skipping type generation (types:gen script not found)${NC}"
  echo "   To regenerate types manually, configure supabase CLI and add 'types:gen' script to package.json"
fi

# Build to verify no errors
echo -e "${YELLOW}🔨 Building to verify...${NC}"
pnpm build > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Build successful${NC}"
else
  echo -e "${RED}❌ Build failed - check types${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}🎉 Migration complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Update WalletSDK to use new RPCs"
echo "2. Run contract tests: pnpm test tests/contracts/wallet-rpcs.test.ts"
echo "3. Commit changes: git add . && git commit -m 'feat: wallet atomic RPCs'"
