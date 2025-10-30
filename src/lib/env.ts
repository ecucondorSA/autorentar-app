/**
 * Environment Variables - Type-safe wrapper
 * Uses Angular's environment files
 *
 * Note: Angular will automatically replace environment.development.ts with environment.ts
 * in production builds via fileReplacements in angular.json
 */

import { environment } from '../environments/environment.development'

const env = {
  // Supabase
  SUPABASE_URL: environment.supabaseUrl,
  SUPABASE_ANON_KEY: environment.supabaseAnonKey,

  // Environment
  NODE_ENV: environment.production ? 'production' : 'development' as
    | 'development'
    | 'test'
    | 'production',

  // Optional: Mapbox, MercadoPago, etc.
  MAPBOX_TOKEN: environment.mapboxToken || '',
  MERCADOPAGO_PUBLIC_KEY: environment.mercadopagoPublicKey || '',
} as const

export default env
