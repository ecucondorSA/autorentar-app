#!/bin/bash
set -e

echo "🔧 Fixing 'as never' type assertions with proper types"
echo "======================================================"

# Count initial occurrences
INITIAL_COUNT=$(grep -r "as never" src --include="*.ts" | grep -v "database.types.ts" | grep -v ".spec.ts" | wc -l)
echo "📊 Found $INITIAL_COUNT 'as never' assertions in source files"

# Fix booking.sdk.ts
echo ""
echo "🔄 Fixing booking.sdk.ts..."
sed -i 's/.insert(validData as never)/.insert(validData as BookingInsert)/g' src/lib/sdk/booking.sdk.ts
sed -i 's/.update(validData as never)/.update(validData as BookingUpdate)/g' src/lib/sdk/booking.sdk.ts
sed -i "s/} as never)/} as RpcFunctions['request_booking']['Returns'])/g" src/lib/sdk/booking.sdk.ts

# Add import at top of file
sed -i '1i import type { BookingInsert, BookingUpdate, RpcFunctions } from '\''@/types/database-helpers'\''' src/lib/sdk/booking.sdk.ts

# Fix car.sdk.ts
echo "🔄 Fixing car.sdk.ts..."
sed -i 's/.insert(validData as never)/.insert(validData as CarInsert)/g' src/lib/sdk/car.sdk.ts
sed -i 's/.update(validData as never)/.update(validData as CarUpdate)/g' src/lib/sdk/car.sdk.ts
sed -i "s/'search_cars_nearby' as never/'search_cars_nearby'/g" src/lib/sdk/car.sdk.ts
sed -i "s/} as never)/} as SearchCarsNearbyParams)/g" src/lib/sdk/car.sdk.ts

# Add import at top of file
sed -i '1i import type { CarInsert, CarUpdate, SearchCarsNearbyParams } from '\''@/types/database-helpers'\''' src/lib/sdk/car.sdk.ts

# Fix profile.sdk.ts
echo "🔄 Fixing profile.sdk.ts..."
sed -i 's/.insert(validData as never)/.insert(validData as ProfileInsert)/g' src/lib/sdk/profile.sdk.ts
sed -i 's/.update(validData as never)/.update(validData as ProfileUpdate)/g' src/lib/sdk/profile.sdk.ts
sed -i "s/.update({ is_active: false } as never)/.update({ is_active: false } as ProfileUpdate)/g" src/lib/sdk/profile.sdk.ts
sed -i "s/} as never)/} as ProfileRow)/g" src/lib/sdk/profile.sdk.ts

# Add import at top of file
sed -i '1i import type { ProfileInsert, ProfileUpdate, ProfileRow } from '\''@/types/database-helpers'\''' src/lib/sdk/profile.sdk.ts

# Fix payment.sdk.ts
echo "🔄 Fixing payment.sdk.ts..."
sed -i 's/.insert(validData as never)/.insert(validData as PaymentInsert)/g' src/lib/sdk/payment.sdk.ts

# Add import at top of file
sed -i '1i import type { PaymentInsert } from '\''@/types/database-helpers'\''' src/lib/sdk/payment.sdk.ts

# Fix review.sdk.ts
echo "🔄 Fixing review.sdk.ts..."
sed -i "s/'create_review' as never/'create_review'/g" src/lib/sdk/review.sdk.ts
sed -i "s/} as never)/} as CreateReviewParams)/g" src/lib/sdk/review.sdk.ts

# Add import at top of file
sed -i '1i import type { CreateReviewParams } from '\''@/types/database-helpers'\''' src/lib/sdk/review.sdk.ts

# Fix services (booking.service.ts)
echo "🔄 Fixing booking.service.ts..."
sed -i "s/} as never)/} as RpcFunctions['request_booking']['Returns'])/g" src/services/booking.service.ts

# Add import at top of file
sed -i '1i import type { RpcFunctions } from '\''@/types/database-helpers'\''' src/services/booking.service.ts

# Fix services (car.service.ts)
echo "🔄 Fixing car.service.ts..."
sed -i "s/} as never)/} as SearchCarsNearbyParams)/g" src/services/car.service.ts

# Add import if not exists
if ! grep -q "SearchCarsNearbyParams" src/services/car.service.ts; then
  sed -i '1i import type { SearchCarsNearbyParams } from '\''@/types/database-helpers'\''' src/services/car.service.ts
fi

# Fix services (payment.service.ts)
echo "🔄 Fixing payment.service.ts..."
sed -i "s/} as never)/} as WalletInitiateDepositParams)/g" src/services/payment.service.ts

# Add import at top of file
sed -i '1i import type { WalletInitiateDepositParams } from '\''@/types/database-helpers'\''' src/services/payment.service.ts

# Fix notification.service.ts
echo "🔄 Fixing notification.service.ts..."
sed -i "s/type: options?.type as never/type: options?.type as NotificationType/g" src/services/notification.service.ts

# Add import at top of file
sed -i '1i import type { NotificationType } from '\''@/types/database-helpers'\''' src/services/notification.service.ts

# Count remaining occurrences (excluding test files)
REMAINING_COUNT=$(grep -r "as never" src --include="*.ts" | grep -v "database.types.ts" | grep -v ".spec.ts" | wc -l || echo "0")

echo ""
echo "======================================================"
echo "✅ Fixed 'as never' assertions"
echo "📊 Initial count: $INITIAL_COUNT"
echo "📊 Remaining count (excluding tests): $REMAINING_COUNT"
echo ""

if [ "$REMAINING_COUNT" -eq 0 ]; then
  echo "🎉 All 'as never' assertions have been replaced!"
else
  echo "⚠️  Some 'as never' remain (likely in test files or complex cases)"
  echo "   These may need manual review:"
  grep -rn "as never" src --include="*.ts" | grep -v "database.types.ts" | grep -v ".spec.ts" || echo "   None found"
fi

echo ""
echo "🧪 Running type check..."
pnpm type-check || {
  echo "❌ Type check failed - some manual fixes may be needed"
  exit 1
}

echo ""
echo "✅ Type check passed! All fixes are valid."
