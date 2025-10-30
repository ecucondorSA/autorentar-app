#!/bin/bash

echo "Adding descriptions to eslint-enable directives..."

# Replace eslint-enable comments with described versions
find src -name "*.spec.ts" -type f -exec sed -i \
  's|/\* eslint-enable @typescript-eslint/no-unsafe-argument \*/|/* eslint-enable @typescript-eslint/no-unsafe-argument -- Re-enable after test file */|g' {} \;

find src -name "*.spec.ts" -type f -exec sed -i \
  's|/\* eslint-enable @typescript-eslint/unbound-method \*/|/* eslint-enable @typescript-eslint/unbound-method -- Re-enable after test file */|g' {} \;

find src -name "*.spec.ts" -type f -exec sed -i \
  's|/\* eslint-enable @typescript-eslint/no-non-null-assertion \*/|/* eslint-enable @typescript-eslint/no-non-null-assertion -- Re-enable after test file */|g' {} \;

find src -name "*.spec.ts" -type f -exec sed -i \
  's|/\* eslint-enable @typescript-eslint/no-unnecessary-condition \*/|/* eslint-enable @typescript-eslint/no-unnecessary-condition -- Re-enable after test file */|g' {} \;

find src -name "*.spec.ts" -type f -exec sed -i \
  's|/\* eslint-enable @typescript-eslint/no-floating-promises \*/|/* eslint-enable @typescript-eslint/no-floating-promises -- Re-enable after test file */|g' {} \;

# Fix multi-line enables
find src -name "*.spec.ts" -type f -exec sed -i \
  's|/\* eslint-enable @typescript-eslint/unbound-method, @typescript-eslint/no-non-null-assertion \*/|/* eslint-enable @typescript-eslint/unbound-method, @typescript-eslint/no-non-null-assertion -- Re-enable after test file */|g' {} \;

find src -name "*.spec.ts" -type f -exec sed -i \
  's|/\* eslint-enable @typescript-eslint/unbound-method, @typescript-eslint/no-floating-promises, @typescript-eslint/no-unnecessary-condition \*/|/* eslint-enable @typescript-eslint/unbound-method, @typescript-eslint/no-floating-promises, @typescript-eslint/no-unnecessary-condition -- Re-enable after test file */|g' {} \;

find src -name "*.spec.ts" -type f -exec sed -i \
  's|/\* eslint-enable @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-unnecessary-condition \*/|/* eslint-enable @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-unnecessary-condition -- Re-enable after test file */|g' {} \;

# Fix SDK files
find src/lib/sdk -name "*.sdk.ts" -type f -exec sed -i \
  's|/\* eslint-enable @typescript-eslint/no-unnecessary-condition \*/|/* eslint-enable @typescript-eslint/no-unnecessary-condition -- Re-enable after SDK file */|g' {} \;

echo "Done!"
