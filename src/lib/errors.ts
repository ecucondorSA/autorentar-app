/**
 * Error Handling Utilities
 * Centralized, type-safe error conversion
 */

/**
 * Safely converts unknown values to Error instances
 * This allows re-enabling strict TypeScript rules that were disabled
 *
 * @param e - Unknown error value from catch blocks or callbacks
 * @returns A proper Error instance
 */
export function toError(e: unknown): Error {
  // Already an Error instance
  if (e instanceof Error) {
    return e
  }

  // String message
  if (typeof e === 'string') {
    return new Error(e)
  }

  // Object with message property
  if (e && typeof e === 'object' && 'message' in e) {
    const message = typeof e.message === 'string' ? e.message : 'Unknown error'
    const error = new Error(message)

    // Preserve additional properties if available
    if ('code' in e && typeof e.code === 'string') {
      (error as Error & { code: string }).code = e.code
    }
    if ('statusCode' in e && typeof e.statusCode === 'number') {
      (error as Error & { statusCode: number }).statusCode = e.statusCode
    }

    return error
  }

  // Try to stringify
  try {
    return new Error(JSON.stringify(e))
  } catch {
    return new Error('Unknown error')
  }
}

/**
 * Type guard to check if an error has a code property
 */
export function hasErrorCode(error: Error): error is Error & { code: string } {
  return 'code' in error && typeof (error as { code: unknown }).code === 'string'
}

/**
 * Type guard to check if an error has a statusCode property
 */
export function hasStatusCode(error: Error): error is Error & { statusCode: number } {
  return 'statusCode' in error && typeof (error as { statusCode: unknown }).statusCode === 'number'
}

/**
 * Extract error code safely
 */
export function getErrorCode(error: Error): string {
  return hasErrorCode(error) ? error.code : 'UNKNOWN_ERROR'
}

/**
 * Extract status code safely
 */
export function getStatusCode(error: Error): number | undefined {
  return hasStatusCode(error) ? error.statusCode : undefined
}
// Test hook
// Test hook v2
