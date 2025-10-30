/**
 * Test Setup - Configure environment for tests
 * This file runs before all test files
 */

// Mock process.env for tests
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/prefer-nullish-coalescing -- Global test setup requires any type and logical OR for process mock */
(globalThis as any).process = (globalThis as any).process || {
  env: {
    NG_APP_SUPABASE_URL: 'https://test.supabase.co',
    NG_APP_SUPABASE_ANON_KEY: 'test-anon-key',
    NODE_ENV: 'test',
    NG_APP_MAPBOX_TOKEN: '',
    NG_APP_MERCADOPAGO_PUBLIC_KEY: '',
  },
}
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/prefer-nullish-coalescing -- End of global test setup: Re-enable after process mock */

// Import zone testing after env setup
import 'zone.js/testing'
