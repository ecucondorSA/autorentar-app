/**
 * Base SDK class
 * Provides common functionality for all SDKs
 */

import type { SupabaseClient } from '@supabase/supabase-js'

import type { ApiResponse, Database, PaginatedResponse } from '@/types'

/**
 * Type guard to check if error is an Error instance
 */
function isError(error: unknown): error is Error {
  return error instanceof Error
}

/**
 * Type guard to check if error has a code property
 */
function hasErrorCode(error: unknown): error is Error & { code: string } {
  return isError(error) && 'code' in error && typeof (error as { code: unknown }).code === 'string'
}

/**
 * Safely extract error message from unknown error
 */
function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'Unknown error'
}

/**
 * Safely extract error code from unknown error
 */
function getErrorCode(error: unknown): string {
  if (hasErrorCode(error)) {
    return error.code
  }
  return 'UNKNOWN_ERROR'
}

export class BaseSDK {
  constructor(protected supabase: SupabaseClient<Database>) {}

  /**
   * Handle Supabase errors and throw appropriate exceptions
   */
  protected handleError(error: unknown, context?: string): never {
    const message = getErrorMessage(error)
    const code = getErrorCode(error)
    const contextMessage = context ? `${context}: ${message}` : message

    throw new SDKError(contextMessage, code, error)
  }

  /**
   * Create paginated response
   */
  protected createPaginatedResponse<T>(
    data: T[],
    count: number | null,
    page: number,
    pageSize: number
  ): PaginatedResponse<T> {
    return {
      data,
      count,
      page,
      pageSize,
      hasMore: count ? (page * pageSize) < count : false,
    }
  }

  /**
   * Create success response
   */
  protected success<T>(data: T): ApiResponse<T> {
    return {
      success: true,
      data,
    }
  }

  /**
   * Create error response
   */
  protected error(message: string, code?: string): ApiResponse<never> {
    return {
      success: false,
      error: message,
      code,
    }
  }

  /**
   * Execute query with error handling
   */
  protected async execute<T>(
    queryFn: () => Promise<{ data: T | null; error: unknown }>
  ): Promise<T> {
    const { data, error } = await queryFn()

    if (error) {
      this.handleError(error)
    }

    if (!data) {
      throw new SDKError('No data returned', 'NO_DATA')
    }

    return data
  }

  /**
   * Execute query with safe response (no throw)
   */
  protected async executeSafe<T>(
    queryFn: () => Promise<{ data: T | null; error: unknown }>
  ): Promise<ApiResponse<T>> {
    try {
      const { data, error } = await queryFn()

      if (error) {
        return this.error(getErrorMessage(error), getErrorCode(error))
      }

      if (!data) {
        return this.error('No data returned', 'NO_DATA')
      }

      return this.success(data)
    } catch (err: unknown) {
      return this.error(getErrorMessage(err), getErrorCode(err))
    }
  }
}

/**
 * Custom SDK Error class
 */
export class SDKError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: unknown
  ) {
    super(message)
    this.name = 'SDKError'
  }
}
