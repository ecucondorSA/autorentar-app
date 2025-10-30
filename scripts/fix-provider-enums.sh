#!/bin/bash
# Fix payment_provider enum mismatches

echo "🔧 Fixing payment_provider enum..."

# Remove invalid providers from type definitions
find src/types/schemas -type f -name "*.ts" -exec sed -i \
  -e "s/'mercadopago' | 'stripe' | 'wallet' | 'bank_transfer' | 'cash'/'mercadopago' | 'stripe' | 'otro'/g" \
  -e "s/\"mercadopago\" | \"stripe\" | \"wallet\" | \"bank_transfer\" | \"cash\"/\"mercadopago\" | \"stripe\" | \"otro\"/g" \
  {} +

# Fix service-types.ts if it has provider definitions
if [ -f "src/types/service-types.ts" ]; then
  sed -i \
    -e "s/'wallet'/'otro'/g" \
    -e "s/'bank_transfer'/'otro'/g" \
    -e "s/'cash'/'otro'/g" \
    src/types/service-types.ts
fi

echo "✅ payment_provider enum fixed"
