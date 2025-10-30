/**
 * NotificationService
 * Business logic layer for notification operations
 *
 * Responsibilities:
 * - Create and manage user notifications
 * - Handle notification preferences
 * - Send bulk notifications
 * - Manage notification lifecycle
 */

import { notificationSDK, type NotificationSDK } from '@/lib/sdk/notification.sdk'
import type {
  NotificationDTO,
  CreateNotificationInput,
  SendBulkNotificationInput,
} from '@/types'

import { toError } from '../lib/errors'

// ============================================
// NOTIFICATION SERVICE ERRORS
// ============================================

export enum NotificationErrorCode {
  NOTIFICATION_NOT_FOUND = 'NOTIFICATION_NOT_FOUND',
  INVALID_NOTIFICATION_TYPE = 'INVALID_NOTIFICATION_TYPE',
  BULK_SEND_FAILED = 'BULK_SEND_FAILED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
}

export class NotificationError extends Error {
  constructor(
    message: string,
    public code: NotificationErrorCode,
    public statusCode: number = 400
  ) {
    super(message)
    this.name = 'NotificationError'
    Object.setPrototypeOf(this, NotificationError.prototype)
  }
}

// ============================================
// NOTIFICATION SERVICE
// ============================================

export class NotificationService {
  constructor(private readonly notificationSDK: NotificationSDK) {}

  /**
   * Create a notification for user
   */
  async createNotification(
    input: CreateNotificationInput
  ): Promise<NotificationDTO> {
    try {
      const notification = await this.notificationSDK.create(input)
      return notification
    } catch (error) {
      throw toError(error)
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(
    userId: string,
    options?: {
      unread_only?: boolean
      type?: string
      limit?: number
      offset?: number
    }
  ): Promise<NotificationDTO[]> {
    try {
      const notifications = await this.notificationSDK.getUserNotifications({
        user_id: userId,
        unread_only: options?.unread_only ?? false,
        type: options?.type as never,
        limit: options?.limit ?? 20,
        offset: options?.offset ?? 0,
      })

      return notifications
    } catch (error) {
      throw toError(error)
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<NotificationDTO> {
    try {
      const notification = await this.notificationSDK.markAsRead(notificationId)
      return notification
    } catch (error) {
      throw toError(error)
    }
  }

  /**
   * Mark all user notifications as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      await this.notificationSDK.markAllAsRead(userId)
    } catch (error) {
      throw toError(error)
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await this.notificationSDK.delete(notificationId)
    } catch (error) {
      throw toError(error)
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const count = await this.notificationSDK.getUnreadCount(userId)
      return count
    } catch (error) {
      throw toError(error)
    }
  }

  /**
   * Delete all read notifications
   */
  async deleteAllRead(userId: string): Promise<void> {
    try {
      await this.notificationSDK.deleteAllRead(userId)
    } catch (error) {
      throw toError(error)
    }
  }

  // ============================================
  // BULK NOTIFICATION OPERATIONS
  // ============================================

  /**
   * Send bulk notifications to multiple users
   */
  async sendBulkNotifications(
    input: SendBulkNotificationInput
  ): Promise<NotificationDTO[]> {
    try {
      // Validate user count
      if (input.user_ids.length === 0) {
        throw new NotificationError(
          'No users specified for bulk notification',
          NotificationErrorCode.BULK_SEND_FAILED,
          400
        )
      }

      if (input.user_ids.length > 1000) {
        throw new NotificationError(
          'Cannot send bulk notification to more than 1000 users at once',
          NotificationErrorCode.BULK_SEND_FAILED,
          400
        )
      }

      // Create notifications in parallel
      const notifications = await Promise.all(
        input.user_ids.map((userId) =>
          this.notificationSDK.create({
            user_id: userId,
            title: input.title,
            body: input.body,
            type: input.type,
            cta_link: input.cta_link,
            metadata: input.metadata,
          })
        )
      )

      return notifications
    } catch (error) {
      if (error instanceof NotificationError) {
        throw error
      }
      throw toError(error)
    }
  }

  // ============================================
  // NOTIFICATION TEMPLATES
  // ============================================

  /**
   * Send booking-related notification
   */
  async notifyNewBooking(
    ownerId: string,
    bookingId: string,
    carName: string
  ): Promise<NotificationDTO> {
    return this.createNotification({
      user_id: ownerId,
      title: 'New Booking Request',
      body: `You have a new booking request for your ${carName}`,
      type: 'new_booking_for_owner',
      cta_link: `/bookings/${bookingId}`,
      metadata: { booking_id: bookingId },
    })
  }

  /**
   * Send booking cancellation notification
   */
  async notifyBookingCancelled(
    userId: string,
    bookingId: string,
    isOwner: boolean
  ): Promise<NotificationDTO> {
    return this.createNotification({
      user_id: userId,
      title: 'Booking Cancelled',
      body: isOwner
        ? 'A booking for your car has been cancelled'
        : 'Your booking has been cancelled',
      type: isOwner
        ? 'booking_cancelled_for_owner'
        : 'booking_cancelled_for_renter',
      cta_link: `/bookings/${bookingId}`,
      metadata: { booking_id: bookingId },
    })
  }

  /**
   * Send payment success notification
   */
  async notifyPaymentSuccessful(
    userId: string,
    amount: number,
    bookingId: string
  ): Promise<NotificationDTO> {
    return this.createNotification({
      user_id: userId,
      title: 'Payment Successful',
      body: `Your payment of $${(amount / 100).toFixed(2)} has been processed`,
      type: 'payment_successful',
      cta_link: `/bookings/${bookingId}`,
      metadata: { booking_id: bookingId, amount },
    })
  }

  /**
   * Send payout success notification
   */
  async notifyPayoutSuccessful(
    userId: string,
    amount: number
  ): Promise<NotificationDTO> {
    return this.createNotification({
      user_id: userId,
      title: 'Payout Successful',
      body: `You have received a payout of $${(amount / 100).toFixed(2)}`,
      type: 'payout_successful',
      cta_link: '/wallet',
      metadata: { amount },
    })
  }

  /**
   * Send inspection reminder
   */
  async notifyInspectionReminder(
    userId: string,
    bookingId: string
  ): Promise<NotificationDTO> {
    return this.createNotification({
      user_id: userId,
      title: 'Inspection Reminder',
      body: 'Don\'t forget to complete your vehicle inspection',
      type: 'inspection_reminder',
      cta_link: `/bookings/${bookingId}/inspection`,
      metadata: { booking_id: bookingId },
    })
  }

  /**
   * Send generic announcement
   */
  async sendAnnouncement(
    userIds: string[],
    title: string,
    body: string,
    ctaLink?: string
  ): Promise<NotificationDTO[]> {
    return this.sendBulkNotifications({
      user_ids: userIds,
      title,
      body,
      type: 'generic_announcement',
      cta_link: ctaLink,
    })
  }
}

// Singleton instance
export const notificationService = new NotificationService(notificationSDK)
