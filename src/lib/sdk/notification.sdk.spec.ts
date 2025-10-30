/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-argument -- Test file */
/**
 * NotificationSDK Tests
 * Tests completos para validar sistema de notificaciones (feature horizontal)
 *
 * Principio: Mejor 2 tests funcionando que se solapen, que gaps de coverage
 */

import type { SupabaseClient } from '@supabase/supabase-js'

import type { NotificationDTO, CreateNotificationInput } from '@/types'

import { NotificationSDK } from './notification.sdk'

describe('NotificationSDK (Feature Horizontal)', () => {
  let sdk: NotificationSDK
  let mockSupabase: jasmine.SpyObj<SupabaseClient>

  // Mock data
  const mockNotification: NotificationDTO = {
    id: 'notif-123',
    user_id: 'user-123',
    title: 'New Message',
    body: 'You have a new message from John',
    cta_link: '/messages/msg-456',
    is_read: false,
    type: 'new_message',
    metadata: { message_id: 'msg-456', sender: 'John' },
    created_at: '2025-10-30T10:00:00Z',
  }

  beforeEach(() => {
    // Create Supabase mock
    mockSupabase = jasmine.createSpyObj('SupabaseClient', ['from'])

    // Inject mock
    sdk = new NotificationSDK(mockSupabase as any)
  })

  // ============================================
  // CREATE NOTIFICATION TESTS
  // ============================================

  describe('create()', () => {
    it('should create notification successfully', async () => {
      // Arrange
      const input: CreateNotificationInput = {
        user_id: 'user-123',
        title: 'New Booking',
        body: 'Your car has been booked',
        type: 'new_booking',
      }

      const mockChain = {
        insert: jasmine.createSpy('insert').and.returnValue({
          select: jasmine.createSpy('select').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(
              Promise.resolve({ data: mockNotification, error: null })
            ),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      // Act
      const result = await sdk.create(input)

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith('notifications')
      expect(mockChain.insert).toHaveBeenCalledWith(jasmine.objectContaining({
        user_id: input.user_id,
        title: input.title,
        body: input.body,
        type: input.type,
        is_read: false,
      }))
      expect(result).toEqual(mockNotification)
    })

    it('should create notification with metadata', async () => {
      // Arrange
      const input: CreateNotificationInput = {
        user_id: 'user-123',
        title: 'Payment Received',
        body: 'You received $100',
        type: 'payment_received',
        metadata: { amount: 10000, currency: 'ARS' },
      }

      const notifWithMetadata = {
        ...mockNotification,
        metadata: { amount: 10000, currency: 'ARS' },
      }

      const mockChain = {
        insert: jasmine.createSpy('insert').and.returnValue({
          select: jasmine.createSpy('select').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(
              Promise.resolve({ data: notifWithMetadata, error: null })
            ),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      // Act
      const result = await sdk.create(input)

      // Assert
      expect(result.metadata).toEqual({ amount: 10000, currency: 'ARS' })
    })

    it('should create notification with CTA link', async () => {
      // Arrange
      const input: CreateNotificationInput = {
        user_id: 'user-123',
        title: 'Review Pending',
        body: 'Please review your recent booking',
        type: 'review_reminder',
        cta_link: '/bookings/booking-789/review',
      }

      const notifWithCTA = {
        ...mockNotification,
        cta_link: '/bookings/booking-789/review',
      }

      const mockChain = {
        insert: jasmine.createSpy('insert').and.returnValue({
          select: jasmine.createSpy('select').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(
              Promise.resolve({ data: notifWithCTA, error: null })
            ),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      // Act
      const result = await sdk.create(input)

      // Assert
      expect(result.cta_link).toBe('/bookings/booking-789/review')
    })

    it('should throw error when notification creation fails', async () => {
      // Arrange
      const input: CreateNotificationInput = {
        user_id: 'user-123',
        title: 'Test',
        type: 'test',
      }

      const mockChain = {
        insert: jasmine.createSpy('insert').and.returnValue({
          select: jasmine.createSpy('select').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(
              Promise.resolve({ data: null, error: { message: 'Database error' } })
            ),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      // Act & Assert
      await expectAsync(sdk.create(input)).toBeRejected()
    })

    it('should validate input with Zod schema', async () => {
      // Arrange - Invalid input (missing title)
      const invalidInput = {
        user_id: 'user-123',
        type: 'test',
      } as CreateNotificationInput

      // Act & Assert
      await expectAsync(sdk.create(invalidInput)).toBeRejected()
    })
  })

  // ============================================
  // GET NOTIFICATION TESTS
  // ============================================

  describe('getById()', () => {
    it('should get notification by id successfully', async () => {
      // Arrange
      const notifId = 'notif-123'

      const mockChain = {
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(
              Promise.resolve({ data: mockNotification, error: null })
            ),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      // Act
      const result = await sdk.getById(notifId)

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith('notifications')
      expect(result).toEqual(mockNotification)
    })

    it('should throw error when notification not found', async () => {
      // Arrange
      const notifId = 'non-existent'

      const mockChain = {
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(
              Promise.resolve({ data: null, error: null })
            ),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      // Act & Assert
      await expectAsync(sdk.getById(notifId)).toBeRejectedWithError('Notification not found')
    })
  })

  // ============================================
  // GET NOTIFICATIONS BY USER TESTS
  // ============================================

  describe('getByUser()', () => {
    it('should get all notifications for user', async () => {
      // Arrange
      const userId = 'user-123'
      const notifications = [
        mockNotification,
        { ...mockNotification, id: 'notif-456', is_read: true },
        { ...mockNotification, id: 'notif-789', type: 'booking_confirmed' },
      ]

      const mockChain = {
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            order: jasmine.createSpy('order').and.returnValue(
              Promise.resolve({ data: notifications, error: null })
            ),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      // Act
      const result = await sdk.getByUser(userId)

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith('notifications')
      expect(result.length).toBe(3)
      expect(result).toEqual(notifications)
    })

    it('should return empty array when user has no notifications', async () => {
      // Arrange
      const userId = 'user-new'

      const mockChain = {
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            order: jasmine.createSpy('order').and.returnValue(
              Promise.resolve({ data: [], error: null })
            ),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      // Act
      const result = await sdk.getByUser(userId)

      // Assert
      expect(result).toEqual([])
    })

    it('should order notifications by created_at DESC', async () => {
      // Arrange
      const userId = 'user-123'
      const notifications = [
        { ...mockNotification, id: 'notif-3', created_at: '2025-10-30T12:00:00Z' },
        { ...mockNotification, id: 'notif-2', created_at: '2025-10-30T11:00:00Z' },
        { ...mockNotification, id: 'notif-1', created_at: '2025-10-30T10:00:00Z' },
      ]

      const mockChain = {
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            order: jasmine.createSpy('order').and.returnValue(
              Promise.resolve({ data: notifications, error: null })
            ),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      // Act
      const result = await sdk.getByUser(userId)

      // Assert
      expect(mockChain.order).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(result[0].id).toBe('notif-3') // Most recent first
    })
  })

  // ============================================
  // GET UNREAD NOTIFICATIONS TESTS
  // ============================================

  describe('getUnread()', () => {
    it('should get only unread notifications for user', async () => {
      // Arrange
      const userId = 'user-123'
      const unreadNotifications = [
        mockNotification, // is_read: false
        { ...mockNotification, id: 'notif-456', is_read: false },
      ]

      const mockChain = {
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            eq: jasmine.createSpy('eq').and.returnValue({
              order: jasmine.createSpy('order').and.returnValue(
                Promise.resolve({ data: unreadNotifications, error: null })
              ),
            }),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      // Act
      const result = await sdk.getUnread(userId)

      // Assert
      expect(result.length).toBe(2)
      expect(result.every(n => !n.is_read)).toBeTrue()
    })

    it('should return empty array when all notifications are read', async () => {
      // Arrange
      const userId = 'user-123'

      const mockChain = {
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            eq: jasmine.createSpy('eq').and.returnValue({
              order: jasmine.createSpy('order').and.returnValue(
                Promise.resolve({ data: [], error: null })
              ),
            }),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      // Act
      const result = await sdk.getUnread(userId)

      // Assert
      expect(result).toEqual([])
    })
  })

  // ============================================
  // MARK AS READ TESTS
  // ============================================

  describe('markAsRead()', () => {
    it('should mark notification as read successfully', async () => {
      // Arrange
      const notifId = 'notif-123'
      const readNotification = { ...mockNotification, is_read: true }

      const mockChain = {
        update: jasmine.createSpy('update').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            select: jasmine.createSpy('select').and.returnValue({
              single: jasmine.createSpy('single').and.returnValue(
                Promise.resolve({ data: readNotification, error: null })
              ),
            }),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      // Act
      const result = await sdk.markAsRead(notifId)

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith('notifications')
      expect(mockChain.update).toHaveBeenCalledWith({ is_read: true })
      expect(result.is_read).toBeTrue()
    })

    it('should throw error when notification not found', async () => {
      // Arrange
      const notifId = 'non-existent'

      const mockChain = {
        update: jasmine.createSpy('update').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            select: jasmine.createSpy('select').and.returnValue({
              single: jasmine.createSpy('single').and.returnValue(
                Promise.resolve({ data: null, error: null })
              ),
            }),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      // Act & Assert
      await expectAsync(sdk.markAsRead(notifId)).toBeRejectedWithError('Notification not found')
    })

    it('should be idempotent (marking read twice should work)', async () => {
      // Arrange
      const notifId = 'notif-123'
      const readNotification = { ...mockNotification, is_read: true }

      const mockChain = {
        update: jasmine.createSpy('update').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            select: jasmine.createSpy('select').and.returnValue({
              single: jasmine.createSpy('single').and.returnValue(
                Promise.resolve({ data: readNotification, error: null })
              ),
            }),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      // Act
      const result1 = await sdk.markAsRead(notifId)
      const result2 = await sdk.markAsRead(notifId)

      // Assert
      expect(result1.is_read).toBeTrue()
      expect(result2.is_read).toBeTrue()
    })
  })

  // ============================================
  // MARK ALL AS READ TESTS
  // ============================================

  describe('markAllAsRead()', () => {
    it('should mark all notifications as read for user', async () => {
      // Arrange
      const userId = 'user-123'

      const mockChain = {
        update: jasmine.createSpy('update').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            eq: jasmine.createSpy('eq').and.returnValue(
              Promise.resolve({ error: null })
            ),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      // Act
      await sdk.markAllAsRead(userId)

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith('notifications')
      expect(mockChain.update).toHaveBeenCalledWith({ is_read: true })
      expect(mockChain.eq).toHaveBeenCalledWith('user_id', userId)
      expect(mockChain.eq).toHaveBeenCalledWith('is_read', false)
    })

    it('should succeed even if no unread notifications', async () => {
      // Arrange
      const userId = 'user-123'

      const mockChain = {
        update: jasmine.createSpy('update').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            eq: jasmine.createSpy('eq').and.returnValue(
              Promise.resolve({ error: null })
            ),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      // Act & Assert (should not throw)
      await expectAsync(sdk.markAllAsRead(userId)).toBeResolved()
    })
  })

  // ============================================
  // DELETE NOTIFICATION TESTS
  // ============================================

  describe('delete()', () => {
    it('should delete notification successfully', async () => {
      // Arrange
      const notifId = 'notif-123'

      const mockChain = {
        delete: jasmine.createSpy('delete').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue(
            Promise.resolve({ error: null })
          ),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      // Act
      await sdk.delete(notifId)

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith('notifications')
      expect(mockChain.delete).toHaveBeenCalled()
      expect(mockChain.eq).toHaveBeenCalledWith('id', notifId)
    })

    it('should handle deletion of non-existent notification', async () => {
      // Arrange
      const notifId = 'non-existent'

      const mockChain = {
        delete: jasmine.createSpy('delete').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue(
            Promise.resolve({ error: null })
          ),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      // Act & Assert (should not throw)
      await expectAsync(sdk.delete(notifId)).toBeResolved()
    })
  })

  // ============================================
  // NOTIFICATION TYPES TESTS
  // ============================================

  describe('Notification Types', () => {
    const notificationTypes = [
      'new_message',
      'new_booking',
      'booking_confirmed',
      'booking_cancelled',
      'payment_received',
      'payment_failed',
      'review_received',
      'review_reminder',
      'kyc_approved',
      'kyc_rejected',
    ]

    notificationTypes.forEach(type => {
      it(`should create notification with type: ${type}`, async () => {
        // Arrange
        const input: CreateNotificationInput = {
          user_id: 'user-123',
          title: `Test ${type}`,
          type,
        }

        const notifWithType = { ...mockNotification, type }

        const mockChain = {
          insert: jasmine.createSpy('insert').and.returnValue({
            select: jasmine.createSpy('select').and.returnValue({
              single: jasmine.createSpy('single').and.returnValue(
                Promise.resolve({ data: notifWithType, error: null })
              ),
            }),
          }),
        }

        mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

        // Act
        const result = await sdk.create(input)

        // Assert
        expect(result.type).toBe(type)
      })
    })
  })

  // ============================================
  // EDGE CASE TESTS
  // ============================================

  describe('Edge Cases', () => {
    it('should handle notifications with null body', async () => {
      // Arrange
      const input: CreateNotificationInput = {
        user_id: 'user-123',
        title: 'Title only',
        type: 'info',
        body: null,
      }

      const notifWithoutBody = { ...mockNotification, body: null }

      const mockChain = {
        insert: jasmine.createSpy('insert').and.returnValue({
          select: jasmine.createSpy('select').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(
              Promise.resolve({ data: notifWithoutBody, error: null })
            ),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      // Act
      const result = await sdk.create(input)

      // Assert
      expect(result.body).toBeNull()
    })

    it('should handle complex metadata object', async () => {
      // Arrange
      const complexMetadata = {
        booking: {
          id: 'booking-123',
          car: { make: 'Toyota', model: 'Corolla' },
          dates: { start: '2025-11-01', end: '2025-11-05' },
        },
        payment: {
          amount: 50000,
          method: 'mercadopago',
        },
      }

      const input: CreateNotificationInput = {
        user_id: 'user-123',
        title: 'Complex notification',
        type: 'info',
        metadata: complexMetadata,
      }

      const notifWithComplexMetadata = {
        ...mockNotification,
        metadata: complexMetadata,
      }

      const mockChain = {
        insert: jasmine.createSpy('insert').and.returnValue({
          select: jasmine.createSpy('select').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(
              Promise.resolve({ data: notifWithComplexMetadata, error: null })
            ),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      // Act
      const result = await sdk.create(input)

      // Assert
      expect(result.metadata).toEqual(complexMetadata)
    })

    it('should handle batch notification marking', async () => {
      // Arrange
      const userId = 'user-123'

      const mockChain = {
        update: jasmine.createSpy('update').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            eq: jasmine.createSpy('eq').and.returnValue(
              Promise.resolve({ error: null })
            ),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      // Act - Mark all as read multiple times concurrently
      await Promise.all([
        sdk.markAllAsRead(userId),
        sdk.markAllAsRead(userId),
        sdk.markAllAsRead(userId),
      ])

      // Assert - All calls should succeed
      expect(mockChain.update).toHaveBeenCalledTimes(3)
    })
  })
})
