/**
 * Environment Variables - Type-safe wrapper
 * Validates required env vars at startup
 */

// Declare process for Angular build environment
declare const process: { env: Record<string, string | undefined> } | undefined

function getEnv(key: string): string {
  // Angular uses global 'process' injected by webpack/esbuild
  const value = (typeof process !== 'undefined') ? process?.env?.[key] : undefined

  if (!value || value === '') {
    throw new Error(`Missing required environment variable: ${key}`)
  }

  return value
}

function getEnvOptional(key: string, defaultValue: string): string {
  try {
    return getEnv(key)
  } catch {
    return defaultValue
  }
}

const env = {
  // Supabase
  SUPABASE_URL: getEnv('NG_APP_SUPABASE_URL'),
  SUPABASE_ANON_KEY: getEnv('NG_APP_SUPABASE_ANON_KEY'),

  // Environment
  NODE_ENV: getEnvOptional('NODE_ENV', 'development') as
    | 'development'
    | 'test'
    | 'production',

  // Optional: Mapbox, MercadoPago, etc.
  MAPBOX_TOKEN: getEnvOptional('NG_APP_MAPBOX_TOKEN', ''),
  MERCADOPAGO_PUBLIC_KEY: getEnvOptional('NG_APP_MERCADOPAGO_PUBLIC_KEY', ''),
} as const

export default env
