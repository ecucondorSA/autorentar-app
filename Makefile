# AutoRentar - Development Makefile
# Quick shortcuts for common tasks

.PHONY: help setup guardrails migrate test check build ci clean

# Default target
help:
	@echo "AutoRentar - Available commands:"
	@echo ""
	@echo "  make setup       - Complete setup (guardrails + migration)"
	@echo "  make guardrails  - Install Husky hooks + CI"
	@echo "  make migrate     - Run wallet RPCs migration"
	@echo "  make test        - Run contract tests"
	@echo "  make check       - Type check + lint"
	@echo "  make build       - Production build"
	@echo "  make ci          - Run all CI checks"
	@echo "  make clean       - Clean build artifacts"
	@echo ""

# Complete setup
setup: guardrails migrate
	@echo "✅ Complete setup finished"

# Install guardrails
guardrails:
	@chmod +x scripts/*.sh
	@./scripts/setup-guardrails.sh

# Run migration
migrate:
	@chmod +x scripts/*.sh
	@./scripts/migrate-wallet-rpcs.sh

# Run contract tests
test:
	@pnpm test tests/contracts --run

# Type check + lint
check:
	@echo "🔍 Type checking..."
	@pnpm typecheck
	@echo "🔧 Linting..."
	@pnpm lint

# Production build
build:
	@echo "🔨 Building..."
	@pnpm build

# CI checks (same as GitHub Actions)
ci: check test build
	@echo "✅ All CI checks passed"

# Clean build artifacts
clean:
	@echo "🧹 Cleaning..."
	@rm -rf dist .angular node_modules/.cache
	@echo "✅ Clean complete"

# Regenerate types
types:
	@echo "🔄 Regenerating types..."
	@pnpm types:gen
	@echo "✅ Types regenerated"

# Quick dev commands
dev:
	@pnpm start

lint-fix:
	@pnpm lint --fix

# Database helpers
db-status:
	@psql "$(SUPABASE_DB_URL)" -c "SELECT version();"

db-migrate:
	@psql "$(SUPABASE_DB_URL)" -f supabase/migrations/20251030_wallet_atomic_rpcs.sql
