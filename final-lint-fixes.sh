#!/bin/bash

echo "Applying final lint fixes..."

# 1. Add eslint-enable to service spec files that are missing it
echo "/* eslint-enable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-argument -- Re-enable after test file */" >> "src/lib/sdk/message.sdk.spec.ts"
echo "/* eslint-enable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-argument -- Re-enable after test file */" >> "src/lib/sdk/notification.sdk.spec.ts"  
echo "/* eslint-enable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-argument -- Re-enable after test file */" >> "src/lib/sdk/review.sdk.spec.ts"

# 2. Fix review.service.spec.ts undescribed comment
sed -i '777s|/\* Review service tests completed \*/|/* Review service tests completed -- End of review service test suite */|g' src/services/review.service.spec.ts

# 3. Fix test-setup.ts undescribed comment  
sed -i '17s|/\* eslint-enable|/* End of global test setup -- eslint-enable|g' src/test-setup.ts

echo "Done!"
