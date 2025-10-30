/**
 * Test Setup - Configure environment for tests
 * This file runs before all test files
 */

// Mock process.env for tests
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access */
(globalThis as any).process = (globalThis as any).process || {
  env: {
    NG_APP_SUPABASE_URL: 'https://test.supabase.co',
    NG_APP_SUPABASE_ANON_KEY: 'test-anon-key',
    NODE_ENV: 'test',
    NG_APP_MAPBOX_TOKEN: '',
    NG_APP_MERCADOPAGO_PUBLIC_KEY: '',
  },
}
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access */

// Import zone testing after env setup
import 'zone.js/testing'
