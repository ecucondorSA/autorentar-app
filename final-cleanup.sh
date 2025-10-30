#!/bin/bash

echo "Final cleanup of remaining errors..."

# 1. Add eslint-enable to message.service.spec.ts
echo "/* eslint-enable @typescript-eslint/no-unsafe-argument -- Re-enable after test file */" >> src/services/message.service.spec.ts

# 2. Fix review.service.ts - change catch to unknown (line 169)
sed -i '169s/(error)/(error: unknown)/g' src/services/review.service.ts

# 3. Fix message.service.ts - change catch to unknown (line 75)
sed -i '75s/(error: Error)/(error: unknown)/g' src/services/message.service.ts

# 4. Fix review.service.spec.ts - add description to comment
sed -i '777s|/\* End of review service test suite \*/|/* Review service test suite completed -- End of test file */|g' src/services/review.service.spec.ts

echo "Done!"
