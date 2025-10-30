/**
 * HTTP Error Interceptor
 * Handles global error responses from HTTP requests
 *
 * Captures:
 * - Network errors
 * - HTTP error responses (4xx, 5xx)
 * - Supabase Edge Function errors
 * - Authentication errors
 *
 * Provides:
 * - User-friendly error messages
 * - Auto-logout on 401 Unauthorized
 * - Error logging
 */

import { inject } from '@angular/core'
import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http'
import { Router } from '@angular/router'
import { catchError, throwError } from 'rxjs'

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router)

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An error occurred'

      if (error.error instanceof ErrorEvent) {
        // Client-side or network error
        errorMessage = `Network error: ${error.error.message}`
        console.error('Client-side error:', error.error)

      } else {
        // Backend error
        console.error(`Backend error ${error.status}:`, error.error)

        switch (error.status) {
          case 400:
            errorMessage = error.error?.message || 'Bad request'
            break

          case 401:
            errorMessage = 'Unauthorized. Please log in.'
            // Auto-logout and redirect to login
            router.navigate(['/login'], {
              queryParams: { returnUrl: router.url }
            })
            break

          case 403:
            errorMessage = error.error?.message || 'Access denied'
            break

          case 404:
            errorMessage = error.error?.message || 'Resource not found'
            break

          case 409:
            errorMessage = error.error?.message || 'Conflict: Resource already exists'
            break

          case 422:
            errorMessage = error.error?.message || 'Validation error'
            break

          case 429:
            errorMessage = 'Too many requests. Please try again later.'
            break

          case 500:
            errorMessage = 'Server error. Please try again later.'
            break

          case 503:
            errorMessage = 'Service temporarily unavailable'
            break

          default:
            errorMessage = error.error?.message || `Error ${error.status}: ${error.statusText}`
        }
      }

      // Show error notification (you can integrate with a toast/snackbar service)
      console.error('HTTP Error:', errorMessage)

      // Re-throw error for component-level handling
      return throwError(() => ({
        message: errorMessage,
        status: error.status,
        originalError: error
      }))
    })
  )
}

/**
 * Retry Interceptor
 * Automatically retries failed requests (configurable)
 */
import { retry, type RetryConfig } from 'rxjs'

export const retryInterceptor: HttpInterceptorFn = (req, next) => {
  // Only retry for safe HTTP methods and specific error codes
  const shouldRetry = (error: HttpErrorResponse) => {
    return (
      req.method === 'GET' &&
      (error.status === 0 || error.status >= 500) && // Network errors or server errors
      error.status !== 501 // Not implemented
    )
  }

  const retryConfig: RetryConfig = {
    count: 3,
    delay: (error: HttpErrorResponse, retryCount: number) => {
      // Exponential backoff: 1s, 2s, 4s
      const delayMs = Math.pow(2, retryCount - 1) * 1000
      console.log(`Retrying request (attempt ${retryCount}) in ${delayMs}ms`)
      return throwError(() => error)
    },
    resetOnSuccess: true
  }

  return next(req).pipe(
    retry(retryConfig)
  )
}

/**
 * Loading Interceptor
 * Shows/hides global loading indicator
 */
import { finalize } from 'rxjs'

let activeRequests = 0

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  activeRequests++
  updateLoadingState(true)

  return next(req).pipe(
    finalize(() => {
      activeRequests--
      if (activeRequests === 0) {
        updateLoadingState(false)
      }
    })
  )
}

function updateLoadingState(isLoading: boolean) {
  // Update global loading state
  // You can dispatch to a state management service (NgRx, Signals, etc.)
  if (isLoading) {
    document.body.classList.add('loading')
  } else {
    document.body.classList.remove('loading')
  }
}
