#!/bin/bash

echo "Adding eslint-enable directives to test files..."

# Files with no-unsafe-argument that need enable
files_unsafe_arg=(
  "src/app/features/auth/register/register.component.spec.ts"
  "src/app/features/bookings/booking-confirmation/booking-confirmation.component.spec.ts"
  "src/app/features/bookings/booking-detail/booking-detail.component.spec.ts"
  "src/app/features/bookings/booking-form/booking-form.component.spec.ts"
  "src/app/features/bookings/bookings-received/bookings-received.component.spec.ts"
  "src/app/features/bookings/my-bookings/my-bookings.component.spec.ts"
  "src/app/features/cars/car-edit/car-edit.component.spec.ts"
  "src/app/features/cars/car-publish/car-publish.component.spec.ts"
  "src/app/features/cars/my-cars/my-cars.component.spec.ts"
  "src/app/features/cars/vehicle-documents/vehicle-documents.component.spec.ts"
  "src/app/features/disputes/disputes-list/disputes-list.component.spec.ts"
  "src/app/features/documents/document-upload/document-upload.component.spec.ts"
  "src/app/features/insurance/claims-list/claims-list.component.spec.ts"
  "src/app/features/insurance/insurance-list/insurance-list.component.spec.ts"
  "src/app/features/messages/chat/chat.component.spec.ts"
  "src/app/features/messages/message-list/message-list.component.spec.ts"
  "src/app/features/notifications/notifications.component.spec.ts"
  "src/app/features/payments/payment-form/payment-form.component.spec.ts"
  "src/app/features/payments/payment-status/payment-status.component.spec.ts"
  "src/app/features/reviews/review-form/review-form.component.spec.ts"
  "src/app/features/reviews/reviews-list/reviews-list.component.spec.ts"
  "src/app/features/wallet/transactions-list/transactions-list.component.spec.ts"
  "src/app/features/wallet/wallet-dashboard/wallet-dashboard.component.spec.ts"
  "src/app/pages/home/home.page.spec.ts"
  "src/app/shared/components/availability-calendar/availability-calendar.component.spec.ts"
  "src/app/shared/components/footer/footer.component.spec.ts"
  "src/app/shared/components/header/header.component.spec.ts"
  "src/app/shared/components/location-picker/location-picker.component.spec.ts"
  "src/app/shared/components/search-bar/search-bar.component.spec.ts"
  "src/app/shared/components/sidemenu/sidemenu.component.spec.ts"
)

for file in "${files_unsafe_arg[@]}"; do
  if [ -f "$file" ]; then
    echo "/* eslint-enable @typescript-eslint/no-unsafe-argument */" >> "$file"
    echo "✓ $file"
  fi
done

# Special files with multiple disables
echo "/* eslint-enable @typescript-eslint/unbound-method */" >> "src/app/features/auth/login/login.component.spec.ts"
echo "/* eslint-enable @typescript-eslint/unbound-method, @typescript-eslint/no-non-null-assertion */" >> "src/app/features/cars/car-detail/car-detail.component.spec.ts"
echo "/* eslint-enable @typescript-eslint/unbound-method, @typescript-eslint/no-floating-promises, @typescript-eslint/no-unnecessary-condition */" >> "src/app/features/cars/car-list/car-list.component.spec.ts"
echo "/* eslint-enable @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-unnecessary-condition */" >> "src/app/features/wallet/withdrawal-form/withdrawal-form.component.spec.ts"
echo "/* eslint-enable @typescript-eslint/no-non-null-assertion */" >> "src/app/shared/components/car-card/car-card.component.spec.ts"

# SDK files
echo "/* eslint-enable @typescript-eslint/no-unnecessary-condition */" >> "src/lib/sdk/booking.sdk.ts"
echo "/* eslint-enable @typescript-eslint/no-unnecessary-condition */" >> "src/lib/sdk/car.sdk.ts"
echo "/* eslint-enable @typescript-eslint/no-unnecessary-condition */" >> "src/lib/sdk/dispute.sdk.ts"
echo "/* eslint-enable @typescript-eslint/no-unnecessary-condition */" >> "src/lib/sdk/document.sdk.ts"

# Service specs
echo "/* eslint-enable @typescript-eslint/unbound-method */" >> "src/services/message.service.spec.ts"
echo "/* eslint-enable @typescript-eslint/unbound-method */" >> "src/services/notification.service.spec.ts"

echo "Done!"
