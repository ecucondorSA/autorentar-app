#!/bin/bash
# Fix payment_status enum mismatches

echo "🔧 Fixing payment_status enum..."

# pending → requires_payment (solo en contexts de payment, no booking)
find src/lib/sdk src/services src/types/schemas -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i \
  -e "s/'pending'\( *| *'completed'\)/'requires_payment'\1/g" \
  -e "s/'pending'\( *| *'processing'\)/'requires_payment'\1/g" \
  {} +

# completed → succeeded (en payment contexts)
find src/lib/sdk/payment.sdk.ts src/services/payment.service.ts -type f -exec sed -i \
  -e "s/'completed'/'succeeded'/g" \
  -e "s/\"completed\"/\"succeeded\"/g" \
  {} +

# partially_refunded → partial_refund
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i \
  -e "s/'partially_refunded'/'partial_refund'/g" \
  -e "s/\"partially_refunded\"/\"partial_refund\"/g" \
  {} +

# disputed → chargeback
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i \
  -e "s/'disputed'/'chargeback'/g" \
  -e "s/\"disputed\"/\"chargeback\"/g" \
  {} +

echo "✅ payment_status enum fixed"
