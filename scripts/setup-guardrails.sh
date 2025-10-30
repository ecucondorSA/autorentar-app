#!/bin/bash
set -euo pipefail

echo "🛡️ Setting up guardrails..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if running from project root
if [ ! -f "package.json" ]; then
  echo "❌ Error: Must run from project root"
  exit 1
fi

# Install husky
echo -e "${YELLOW}📦 Installing Husky...${NC}"
pnpm add -D husky
pnpm exec husky install

# Pre-commit hook
echo -e "${YELLOW}🪝 Creating pre-commit hook...${NC}"
mkdir -p .husky
cat > .husky/pre-commit << 'EOF'
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🔍 Pre-commit checks..."

# Regenerate types if database.types.ts changed
if git diff --cached --name-only | grep -q "database.types.ts"; then
  echo "⚠️  database.types.ts changed - regenerating..."
  pnpm types:gen
  git add src/types/database.types.ts
fi

# Lint and fix
echo "🔧 Running ESLint..."
pnpm eslint . --ext .ts,.tsx --fix --quiet || {
  echo "❌ Linting failed"
  exit 1
}
git add -A

# Type check
echo "🔍 Type checking..."
pnpm typecheck || {
  echo "❌ Type check failed"
  exit 1
}

# Check for banned patterns
if grep -rn "as never" src --include="*.ts" | grep -v "database.types.ts"; then
  echo "❌ Found 'as never' - use proper types"
  exit 1
fi

echo "✅ Pre-commit checks passed"
EOF
chmod +x .husky/pre-commit

# Pre-push hook
echo -e "${YELLOW}🪝 Creating pre-push hook...${NC}"
cat > .husky/pre-push << 'EOF'
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🚀 Pre-push checks..."

# Run contract tests if they exist
if [ -d "tests/contracts" ]; then
  echo "🧪 Running contract tests..."
  pnpm test tests/contracts --run || {
    echo "❌ Contract tests failed"
    exit 1
  }
fi

# Build
echo "🔨 Building..."
pnpm build || {
  echo "❌ Build failed"
  exit 1
}

echo "✅ Pre-push checks passed"
EOF
chmod +x .husky/pre-push

# GitHub Actions
echo -e "${YELLOW}⚙️  Creating GitHub Actions workflow...${NC}"
mkdir -p .github/workflows
cat > .github/workflows/contracts.yaml << 'EOF'
name: Contract Tests
on: [push, pull_request]

jobs:
  contracts:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Enable Corepack
        run: corepack enable

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Check for banned patterns
        run: |
          if grep -rn "as never" src --include="*.ts" | grep -v "database.types.ts"; then
            echo "❌ Found 'as never' outside database.types.ts"
            exit 1
          fi

      - name: Type check
        run: pnpm typecheck

      - name: Contract tests
        run: pnpm test tests/contracts --run
        if: ${{ hashFiles('tests/contracts') != '' }}

      - name: Build
        run: pnpm build
EOF

echo ""
echo -e "${GREEN}✅ Guardrails installed${NC}"
echo ""
echo "📝 What was installed:"
echo "  - Husky pre-commit hook (lint, typecheck, ban 'as never')"
echo "  - Husky pre-push hook (tests, build)"
echo "  - GitHub Actions workflow (CI on push/PR)"
echo ""
echo "Next steps:"
echo "1. Commit changes: git add .husky .github && git commit -m 'chore: add guardrails'"
echo "2. Test hooks: make a small change and commit"
