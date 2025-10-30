/**
 * AnalyticsService
 * Servicio para tracking de eventos y métricas de usuario (Feature Horizontal - OPCIONAL)
 *
 * Para MVP, se puede usar directamente Google Analytics.
 * Este servicio proporciona abstracción para facilitar cambio de provider.
 */

export type AnalyticsEventType =
  | 'search'
  | 'booking_created'
  | 'payment_completed'
  | 'review_created'
  | 'message_sent'
  | 'car_published'
  | 'wallet_deposit'
  | 'login'
  | 'signup'
  | 'refund'

export interface TrackEventParams {
  [key: string]: string | number | boolean | object | null
}

export interface PageViewData {
  path?: string
  title?: string
}

export interface UserProperties {
  user_id?: string
  user_role?: string
  user_location?: string
  signup_date?: string
  [key: string]: string | undefined
}

export interface ConversionData {
  type: 'booking' | 'signup' | 'payment'
  value_cents?: number
  currency?: string
}

export class AnalyticsService {
  private window: any

  constructor(windowRef: any) {
    this.window = windowRef
  }

  /**
   * Track an event with optional parameters
   */
  trackEvent(eventType: AnalyticsEventType | string, params?: TrackEventParams): void {
    try {
      if (this.window?.gtag) {
        this.window.gtag('event', eventType, params || {})
      }
    } catch (error) {
      console.debug('[Analytics] Error tracking event:', error)
    }
  }

  /**
   * Track a page view
   */
  trackPageView(pageData: PageViewData): void {
    try {
      if (this.window?.gtag) {
        const params: Record<string, string> = {}
        if (pageData.path) params['page_path'] = pageData.path
        if (pageData.title) params['page_title'] = pageData.title
        this.window.gtag('event', 'page_view', params)
      }
    } catch (error) {
      console.debug('[Analytics] Error tracking page view:', error)
    }
  }

  /**
   * Set user properties for segmentation
   */
  setUserProperties(properties: UserProperties): void {
    try {
      if (this.window?.gtag) {
        // Google Analytics uses 'config' for user properties
        this.window.gtag('config', this.window.GA_MEASUREMENT_ID || 'G-DEFAULT', properties)
      }
    } catch (error) {
      console.debug('[Analytics] Error setting user properties:', error)
    }
  }

  /**
   * Track a conversion event
   */
  trackConversion(conversion: ConversionData): void {
    try {
      const eventName = `${conversion.type}_conversion`
      const params: Record<string, unknown> = {
        currency: conversion.currency || 'ARS',
      }

      // Convert cents to dollars for GA4 (which prefers dollars)
      if (conversion.value_cents !== undefined) {
        params['value'] = conversion.value_cents / 100
      }

      if (this.window?.gtag) {
        this.window.gtag('event', eventName, params)
      }
    } catch (error) {
      console.debug('[Analytics] Error tracking conversion:', error)
    }
  }

  /**
   * Track an exception (error) event
   */
  trackException(
    error: Error | null,
    context: string,
    fatal: boolean = false
  ): void {
    try {
      if (this.window?.gtag) {
        const description = error ? `${context}: ${error.message}` : context
        this.window.gtag('event', 'exception', {
          description,
          fatal,
        })
      }
    } catch (trackingError) {
      console.debug('[Analytics] Error tracking exception:', trackingError)
    }
  }
}
