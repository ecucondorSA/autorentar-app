/**
 * Type Exports - AutoRentar
 *
 * Central export file for all types, guards, and utilities
 * Updated: 29 October 2025 - Added type-safe facade over Supabase types
 * Updated: 29 October 2025 - Isolated auto-generated types to prevent error propagation
 */

// ============================================
// TYPE-SAFE DATABASE FACADE
// ============================================
// Clean, isolated layer over auto-generated types
// This prevents type errors in database.types.ts from contaminating the project
export type * from './db'

// ============================================
// HELPER TYPES & UTILITIES
// ============================================
// Type utilities to make Database types easier to use
export type * from './helpers'

// ============================================
// ZOD SCHEMAS (Runtime Validation)
// ============================================
// Validation schemas for all inputs, updates, and filters
export * from './schemas'

// ============================================
// DTOs (Data Transfer Objects)
// ============================================
// Type-safe, validated shapes for API boundaries
export * from './dto'

// ============================================
// SERVICE TYPES
// ============================================
// Types specific to the service layer (business logic)
export * from './service-types'
