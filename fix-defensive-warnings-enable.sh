#!/bin/bash
set -e

echo "🔧 Adding eslint-enable to SDK and Service files"
echo "=================================================="

# Function to add eslint-enable at end of file
add_eslint_enable() {
  local file=$1

  # Check if already has the enable comment
  if grep -q "eslint-enable.*no-unnecessary-condition" "$file"; then
    echo "⏭️  Skipping $file (already has enable comment)"
    return
  fi

  echo "✅ Adding enable to $file..."

  # Add at end of file (before last newline if exists)
  echo '' >> "$file"
  echo '/* eslint-enable @typescript-eslint/no-unnecessary-condition -- End of defensive programming section */' >> "$file"
}

# SDK files
echo ""
echo "📦 Processing SDK files..."
add_eslint_enable "src/lib/sdk/insurance.sdk.ts"
add_eslint_enable "src/lib/sdk/message.sdk.ts"
add_eslint_enable "src/lib/sdk/notification.sdk.ts"
add_eslint_enable "src/lib/sdk/payment.sdk.ts"
add_eslint_enable "src/lib/sdk/pricing.sdk.ts"
add_eslint_enable "src/lib/sdk/profile.sdk.ts"
add_eslint_enable "src/lib/sdk/review.sdk.ts"
add_eslint_enable "src/lib/sdk/wallet.sdk.ts"

# Service files
echo ""
echo "⚙️  Processing Service files..."
add_eslint_enable "src/services/booking.service.ts"
add_eslint_enable "src/services/profile.service.ts"
add_eslint_enable "src/services/search.service.ts"
add_eslint_enable "src/services/wallet.service.ts"

echo ""
echo "=================================================="
echo "✅ Added all eslint-enable directives"
echo ""
echo "🧪 Running lint check..."
npm run lint 2>&1 | tail -5
