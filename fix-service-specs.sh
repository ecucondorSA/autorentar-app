#!/bin/bash

echo "Fixing service spec files..."

# Message service spec
sed -i '1i/* eslint-disable @typescript-eslint/unbound-method -- Test file with Jasmine spies */' src/services/message.service.spec.ts

# Notification service spec  
sed -i '1i/* eslint-disable @typescript-eslint/unbound-method -- Test file with Jasmine spies */' src/services/notification.service.spec.ts

echo "Fixing test-setup.ts eslint comments..."
# Fix test-setup.ts - add no-unsafe-assignment to the disable list
sed -i '7s/@typescript-eslint\/no-explicit-any/@typescript-eslint\/no-explicit-any, @typescript-eslint\/no-unsafe-assignment/g' src/test-setup.ts
sed -i '17s/@typescript-eslint\/no-explicit-any/@typescript-eslint\/no-explicit-any, @typescript-eslint\/no-unsafe-assignment/g' src/test-setup.ts

echo "Fixing review.service.ts unused variable..."
sed -i 's/_error: unknown/error: unknown/g' src/services/review.service.ts

echo "Fixing review.service.spec.ts eslint comment description..."
sed -i '776s/^/\/* Review service tests completed *\/\n/' src/services/review.service.spec.ts

echo "Done!"
