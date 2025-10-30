/**
 * NotificationService Tests (Feature Horizontal)
 * Tests for business logic layer of notification operations
 *
 * Coverage:
 * - createNotification
 * - getUserNotifications with filters
 * - Bulk notifications with validation
 * - Template-based notifications (bookings, payments, etc.)
 * - Error handling and edge cases
 */

import type { NotificationSDK } from '@/lib/sdk/notification.sdk'
import type { NotificationDTO, CreateNotificationInput } from '@/types'

import {
  NotificationService,
  NotificationError,
  NotificationErrorCode,
} from './notification.service'

describe('NotificationService (Feature Horizontal)', () => {
  let service: NotificationService
  let mockNotificationSDK: jasmine.SpyObj<NotificationSDK>

  // Mock data
  const mockUserId = 'user-123'
  const mockNotificationId = 'notif-001'

  const mockNotification: NotificationDTO = {
    id: mockNotificationId,
    user_id: mockUserId,
    title: 'Test Notification',
    body: 'This is a test notification',
    type: 'new_booking_for_owner',
    is_read: false,
    cta_link: '/bookings/123',
    metadata: { booking_id: 'booking-123' },
    created_at: new Date().toISOString(),
  }

  beforeEach(() => {
    // Create spy for NotificationSDK
    mockNotificationSDK = jasmine.createSpyObj<NotificationSDK>('NotificationSDK', [
      'create',
      'getById',
      'getUserNotifications',
      'getUnreadCount',
      'markAsRead',
      'markAllAsRead',
      'delete',
      'deleteAllRead',
    ])

    // Create service instance
    service = new NotificationService(mockNotificationSDK)
  })

  // ============================================
  // CREATE NOTIFICATION TESTS
  // ============================================

  describe('createNotification()', () => {
    it('should create notification successfully', async () => {
      const input: CreateNotificationInput = {
        user_id: mockUserId,
        title: 'New Booking',
        body: 'You have a new booking request',
        type: 'new_booking_for_owner',
      }

      mockNotificationSDK.create.and.returnValue(Promise.resolve(mockNotification))

      const result = await service.createNotification(input)

      expect(mockNotificationSDK.create).toHaveBeenCalledWith(input)
      expect(result).toEqual(mockNotification)
    })

    it('should create notification with metadata', async () => {
      const input: CreateNotificationInput = {
        user_id: mockUserId,
        title: 'Payment Received',
        body: 'You received $100',
        type: 'payment_successful',
        metadata: { amount: 10000, currency: 'ARS' },
      }

      mockNotificationSDK.create.and.returnValue(
        Promise.resolve({ ...mockNotification, metadata: input.metadata ?? null })
      )

      const result = await service.createNotification(input)

      expect(result.metadata).toEqual({ amount: 10000, currency: 'ARS' })
    })

    it('should create notification with CTA link', async () => {
      const input: CreateNotificationInput = {
        user_id: mockUserId,
        title: 'New Message',
        body: 'You have a new message',
        type: 'new_chat_message',
        cta_link: '/messages/conversation-123',
      }

      mockNotificationSDK.create.and.returnValue(
        Promise.resolve({ ...mockNotification, cta_link: input.cta_link ?? null })
      )

      const result = await service.createNotification(input)

      expect(result.cta_link).toBe('/messages/conversation-123')
    })
  })

  // ============================================
  // GET USER NOTIFICATIONS TESTS
  // ============================================

  describe('getUserNotifications()', () => {
    it('should get all user notifications with default options', async () => {
      const notifications: NotificationDTO[] = [mockNotification]

      mockNotificationSDK.getUserNotifications.and.returnValue(Promise.resolve(notifications))

      const result = await service.getUserNotifications(mockUserId)

      expect(mockNotificationSDK.getUserNotifications).toHaveBeenCalledWith({
        user_id: mockUserId,
        unread_only: false,
        type: undefined as never,
        limit: 20,
        offset: 0,
      })
      expect(result).toEqual(notifications)
    })

    it('should get only unread notifications', async () => {
      const unreadNotifications: NotificationDTO[] = [
        { ...mockNotification, is_read: false },
      ]

      mockNotificationSDK.getUserNotifications.and.returnValue(
        Promise.resolve(unreadNotifications)
      )

      const result = await service.getUserNotifications(mockUserId, {
        unread_only: true,
      })

      expect(mockNotificationSDK.getUserNotifications).toHaveBeenCalledWith({
        user_id: mockUserId,
        unread_only: true,
        type: undefined as never,
        limit: 20,
        offset: 0,
      })
      expect(result.every((n) => !n.is_read)).toBeTrue()
    })

    it('should filter notifications by type', async () => {
      const bookingNotifications: NotificationDTO[] = [
        { ...mockNotification, type: 'new_booking_for_owner' },
      ]

      mockNotificationSDK.getUserNotifications.and.returnValue(
        Promise.resolve(bookingNotifications)
      )

      const result = await service.getUserNotifications(mockUserId, {
        type: 'new_booking_for_owner',
      })

      expect(mockNotificationSDK.getUserNotifications).toHaveBeenCalledWith(
        jasmine.objectContaining({
          type: 'new_booking_for_owner' as never,
        })
      )
      expect(result.every((n) => n.type === 'new_booking_for_owner')).toBeTrue()
    })

    it('should support pagination with limit and offset', async () => {
      mockNotificationSDK.getUserNotifications.and.returnValue(Promise.resolve([]))

      await service.getUserNotifications(mockUserId, {
        limit: 50,
        offset: 100,
      })

      expect(mockNotificationSDK.getUserNotifications).toHaveBeenCalledWith({
        user_id: mockUserId,
        unread_only: false,
        type: undefined as never,
        limit: 50,
        offset: 100,
      })
    })
  })

  // ============================================
  // MARK AS READ TESTS
  // ============================================

  describe('markAsRead()', () => {
    it('should mark notification as read', async () => {
      const readNotification: NotificationDTO = {
        ...mockNotification,
        is_read: true,
      }

      mockNotificationSDK.markAsRead.and.returnValue(Promise.resolve(readNotification))

      const result = await service.markAsRead(mockNotificationId)

      expect(mockNotificationSDK.markAsRead).toHaveBeenCalledWith(mockNotificationId)
      expect(result.is_read).toBeTrue()
    })
  })

  describe('markAllAsRead()', () => {
    it('should mark all user notifications as read', async () => {
      mockNotificationSDK.markAllAsRead.and.returnValue(Promise.resolve())

      await service.markAllAsRead(mockUserId)

      expect(mockNotificationSDK.markAllAsRead).toHaveBeenCalledWith(mockUserId)
    })
  })

  // ============================================
  // DELETE NOTIFICATION TESTS
  // ============================================

  describe('deleteNotification()', () => {
    it('should delete notification', async () => {
      mockNotificationSDK.delete.and.returnValue(Promise.resolve())

      await service.deleteNotification(mockNotificationId)

      expect(mockNotificationSDK.delete).toHaveBeenCalledWith(mockNotificationId)
    })
  })

  describe('getUnreadCount()', () => {
    it('should get unread notification count', async () => {
      mockNotificationSDK.getUnreadCount.and.returnValue(Promise.resolve(5))

      const result = await service.getUnreadCount(mockUserId)

      expect(mockNotificationSDK.getUnreadCount).toHaveBeenCalledWith(mockUserId)
      expect(result).toBe(5)
    })

    it('should return 0 when no unread notifications', async () => {
      mockNotificationSDK.getUnreadCount.and.returnValue(Promise.resolve(0))

      const result = await service.getUnreadCount(mockUserId)

      expect(result).toBe(0)
    })
  })

  describe('deleteAllRead()', () => {
    it('should delete all read notifications', async () => {
      mockNotificationSDK.deleteAllRead.and.returnValue(Promise.resolve())

      await service.deleteAllRead(mockUserId)

      expect(mockNotificationSDK.deleteAllRead).toHaveBeenCalledWith(mockUserId)
    })
  })

  // ============================================
  // BULK NOTIFICATIONS TESTS
  // ============================================

  describe('sendBulkNotifications()', () => {
    it('should send bulk notifications to multiple users', async () => {
      const userIds = ['user-1', 'user-2', 'user-3']
      const input = {
        user_ids: userIds,
        title: 'System Announcement',
        body: 'We are performing maintenance tonight',
        type: 'generic_announcement' as const,
      }

      mockNotificationSDK.create.and.returnValues(
        Promise.resolve({ ...mockNotification, id: 'notif-1', user_id: 'user-1' }),
        Promise.resolve({ ...mockNotification, id: 'notif-2', user_id: 'user-2' }),
        Promise.resolve({ ...mockNotification, id: 'notif-3', user_id: 'user-3' })
      )

      const results = await service.sendBulkNotifications(input)

      expect(mockNotificationSDK.create).toHaveBeenCalledTimes(3)
      expect(results.length).toBe(3)
      expect(results[0]?.user_id).toBe('user-1')
      expect(results[1]?.user_id).toBe('user-2')
      expect(results[2]?.user_id).toBe('user-3')
    })

    it('should throw error when no users specified', async () => {
      const input = {
        user_ids: [],
        title: 'Test',
        body: 'Test body',
        type: 'generic_announcement' as const,
      }

      await expectAsync(service.sendBulkNotifications(input)).toBeRejectedWithError(
        NotificationError,
        'No users specified for bulk notification'
      )

      expect(mockNotificationSDK.create).not.toHaveBeenCalled()
    })

    it('should throw error when more than 1000 users specified', async () => {
      const userIds = Array.from({ length: 1001 }, (_, i) => `user-${i}`)
      const input = {
        user_ids: userIds,
        title: 'Test',
        body: 'Test body',
        type: 'generic_announcement' as const,
      }

      await expectAsync(service.sendBulkNotifications(input)).toBeRejectedWithError(
        NotificationError,
        'Cannot send bulk notification to more than 1000 users at once'
      )

      expect(mockNotificationSDK.create).not.toHaveBeenCalled()
    })

    it('should send bulk notifications with metadata and CTA', async () => {
      const input = {
        user_ids: ['user-1', 'user-2'],
        title: 'New Feature',
        body: 'Check out our new feature!',
        type: 'generic_announcement' as const,
        cta_link: '/features/new',
        metadata: { feature_id: 'feature-123' },
      }

      mockNotificationSDK.create.and.returnValue(Promise.resolve(mockNotification))

      await service.sendBulkNotifications(input)

      expect(mockNotificationSDK.create).toHaveBeenCalledWith(
        jasmine.objectContaining({
          cta_link: '/features/new',
          metadata: { feature_id: 'feature-123' },
        })
      )
    })
  })

  // ============================================
  // TEMPLATE NOTIFICATIONS TESTS
  // ============================================

  describe('Template Notifications', () => {
    describe('notifyNewBooking()', () => {
      it('should send new booking notification to owner', async () => {
        const ownerId = 'owner-123'
        const bookingId = 'booking-456'
        const carName = 'Toyota Corolla 2020'

        mockNotificationSDK.create.and.returnValue(Promise.resolve(mockNotification))

        const result = await service.notifyNewBooking(ownerId, bookingId, carName)

        expect(mockNotificationSDK.create).toHaveBeenCalledWith({
          user_id: ownerId,
          title: 'New Booking Request',
          body: `You have a new booking request for your ${carName}`,
          type: 'new_booking_for_owner',
          cta_link: `/bookings/${bookingId}`,
          metadata: { booking_id: bookingId },
        })
        expect(result).toEqual(mockNotification)
      })
    })

    describe('notifyBookingCancelled()', () => {
      it('should send cancellation notification to owner', async () => {
        const userId = 'owner-123'
        const bookingId = 'booking-456'

        mockNotificationSDK.create.and.returnValue(Promise.resolve(mockNotification))

        await service.notifyBookingCancelled(userId, bookingId, true)

        expect(mockNotificationSDK.create).toHaveBeenCalledWith(
          jasmine.objectContaining({
            user_id: userId,
            title: 'Booking Cancelled',
            body: 'A booking for your car has been cancelled',
            type: 'booking_cancelled_for_owner',
          })
        )
      })

      it('should send cancellation notification to renter', async () => {
        const userId = 'renter-123'
        const bookingId = 'booking-456'

        mockNotificationSDK.create.and.returnValue(Promise.resolve(mockNotification))

        await service.notifyBookingCancelled(userId, bookingId, false)

        expect(mockNotificationSDK.create).toHaveBeenCalledWith(
          jasmine.objectContaining({
            user_id: userId,
            title: 'Booking Cancelled',
            body: 'Your booking has been cancelled',
            type: 'booking_cancelled_for_renter',
          })
        )
      })
    })

    describe('notifyPaymentSuccessful()', () => {
      it('should send payment success notification', async () => {
        const userId = 'user-123'
        const amount = 50000 // 500.00 ARS
        const bookingId = 'booking-456'

        mockNotificationSDK.create.and.returnValue(Promise.resolve(mockNotification))

        await service.notifyPaymentSuccessful(userId, amount, bookingId)

        expect(mockNotificationSDK.create).toHaveBeenCalledWith({
          user_id: userId,
          title: 'Payment Successful',
          body: 'Your payment of $500.00 has been processed',
          type: 'payment_successful',
          cta_link: `/bookings/${bookingId}`,
          metadata: { booking_id: bookingId, amount },
        })
      })

      it('should format amount correctly with 2 decimals', async () => {
        mockNotificationSDK.create.and.returnValue(Promise.resolve(mockNotification))

        await service.notifyPaymentSuccessful('user-123', 12345, 'booking-456')

        expect(mockNotificationSDK.create).toHaveBeenCalledWith(
          jasmine.objectContaining({
            body: 'Your payment of $123.45 has been processed',
          })
        )
      })
    })

    describe('notifyPayoutSuccessful()', () => {
      it('should send payout success notification', async () => {
        const userId = 'owner-123'
        const amount = 100000 // 1000.00 ARS

        mockNotificationSDK.create.and.returnValue(Promise.resolve(mockNotification))

        await service.notifyPayoutSuccessful(userId, amount)

        expect(mockNotificationSDK.create).toHaveBeenCalledWith({
          user_id: userId,
          title: 'Payout Successful',
          body: 'You have received a payout of $1000.00',
          type: 'payout_successful',
          cta_link: '/wallet',
          metadata: { amount },
        })
      })
    })

    describe('notifyInspectionReminder()', () => {
      it('should send inspection reminder', async () => {
        const userId = 'user-123'
        const bookingId = 'booking-456'

        mockNotificationSDK.create.and.returnValue(Promise.resolve(mockNotification))

        await service.notifyInspectionReminder(userId, bookingId)

        expect(mockNotificationSDK.create).toHaveBeenCalledWith({
          user_id: userId,
          title: 'Inspection Reminder',
          body: "Don't forget to complete your vehicle inspection",
          type: 'inspection_reminder',
          cta_link: `/bookings/${bookingId}/inspection`,
          metadata: { booking_id: bookingId },
        })
      })
    })

    describe('sendAnnouncement()', () => {
      it('should send announcement to multiple users', async () => {
        const userIds = ['user-1', 'user-2', 'user-3']
        const title = 'New Feature Available'
        const body = 'Check out our new instant booking feature!'
        const ctaLink = '/features/instant-booking'

        mockNotificationSDK.create.and.returnValue(Promise.resolve(mockNotification))

        const results = await service.sendAnnouncement(userIds, title, body, ctaLink)

        expect(mockNotificationSDK.create).toHaveBeenCalledTimes(3)
        expect(mockNotificationSDK.create).toHaveBeenCalledWith(
          jasmine.objectContaining({
            title,
            body,
            type: 'generic_announcement',
            cta_link: ctaLink,
          })
        )
        expect(results.length).toBe(3)
      })

      it('should send announcement without CTA link', async () => {
        const userIds = ['user-1']
        const title = 'Maintenance Notice'
        const body = 'Scheduled maintenance tonight at 11 PM'

        mockNotificationSDK.create.and.returnValue(Promise.resolve(mockNotification))

        await service.sendAnnouncement(userIds, title, body)

        expect(mockNotificationSDK.create).toHaveBeenCalledWith(
          jasmine.objectContaining({
            cta_link: undefined,
          })
        )
      })
    })
  })

  // ============================================
  // ERROR HANDLING TESTS
  // ============================================

  describe('Error Handling', () => {
    it('should throw error when SDK fails', async () => {
      const input: CreateNotificationInput = {
        user_id: mockUserId,
        title: 'Test',
        body: 'Test body',
        type: 'new_booking_for_owner',
      }

      mockNotificationSDK.create.and.returnValue(
        Promise.reject(new Error('Database connection lost'))
      )

      await expectAsync(service.createNotification(input)).toBeRejected()
    })

    it('should propagate NotificationError with correct code', async () => {
      const input = {
        user_ids: [],
        title: 'Test',
        body: 'Test body',
        type: 'generic_announcement' as const,
      }

      try {
        await service.sendBulkNotifications(input)
        fail('Should have thrown NotificationError')
      } catch (error) {
        expect(error).toBeInstanceOf(NotificationError)
        if (error instanceof NotificationError) {
          expect(error.code).toBe(NotificationErrorCode.BULK_SEND_FAILED)
          expect(error.statusCode).toBe(400)
        }
      }
    })
  })

  // ============================================
  // EDGE CASES
  // ============================================

  describe('Edge Cases', () => {
    it('should handle notification with null body', async () => {
      const input: CreateNotificationInput = {
        user_id: mockUserId,
        title: 'Title Only',
        body: '',
        type: 'generic_announcement',
      }

      mockNotificationSDK.create.and.returnValue(
        Promise.resolve({ ...mockNotification, body: '' })
      )

      const result = await service.createNotification(input)

      expect(result.body).toBe('')
    })

    it('should handle notification with complex metadata', async () => {
      const complexMetadata = {
        booking: {
          id: 'booking-123',
          car: { id: 'car-456', name: 'Toyota Corolla' },
          dates: { start: '2025-01-01', end: '2025-01-05' },
        },
        pricing: { total: 50000, currency: 'ARS' },
      }

      const input: CreateNotificationInput = {
        user_id: mockUserId,
        title: 'Booking Confirmed',
        body: 'Your booking has been confirmed',
        type: 'new_booking_for_owner',
        metadata: complexMetadata,
      }

      mockNotificationSDK.create.and.returnValue(
        Promise.resolve({ ...mockNotification, metadata: complexMetadata })
      )

      const result = await service.createNotification(input)

      expect(result.metadata).toEqual(complexMetadata)
    })

    it('should handle zero amount in payment notification', async () => {
      mockNotificationSDK.create.and.returnValue(Promise.resolve(mockNotification))

      await service.notifyPaymentSuccessful('user-123', 0, 'booking-456')

      expect(mockNotificationSDK.create).toHaveBeenCalledWith(
        jasmine.objectContaining({
          body: 'Your payment of $0.00 has been processed',
        })
      )
    })

    it('should handle very long notification body', async () => {
      const longBody = 'a'.repeat(1000)
      const input: CreateNotificationInput = {
        user_id: mockUserId,
        title: 'Test',
        body: longBody,
        type: 'generic_announcement',
      }

      mockNotificationSDK.create.and.returnValue(
        Promise.resolve({ ...mockNotification, body: longBody })
      )

      const result = await service.createNotification(input)

      expect(result.body.length).toBe(1000)
    })
  })
})
