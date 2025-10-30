/* eslint-disable @typescript-eslint/unbound-method -- Test file with Jasmine spies */
/**
 * MessageService Tests (Feature Horizontal)
 * Tests for business logic layer of messaging operations
 *
 * Coverage:
 * - sendMessage with notification triggering
 * - sendMessage validation (sender != recipient)
 * - getConversation validation
 * - markConversationAsRead batch operation
 * - Push token operations
 * - Error handling and edge cases
 */

import type { MessageSDK } from '@/lib/sdk/message.sdk'
import type { NotificationSDK } from '@/lib/sdk/notification.sdk'
import type { MessageDTO, CreateMessageInput, PushTokenDTO } from '@/types'

import { MessageService, MessageError, MessageErrorCode } from './message.service'

describe('MessageService (Feature Horizontal)', () => {
  let service: MessageService
  let mockMessageSDK: jasmine.SpyObj<MessageSDK>
  let mockNotificationSDK: jasmine.SpyObj<NotificationSDK>

  // Mock data
  const mockSenderId = 'user-sender-123'
  const mockRecipientId = 'user-recipient-456'
  const mockBookingId = 'booking-789'

  const mockMessage: MessageDTO = {
    id: 'msg-001',
    sender_id: mockSenderId,
    recipient_id: mockRecipientId,
    body: 'Hello, is the car still available?',
    booking_id: mockBookingId,
    car_id: null,
    created_at: new Date().toISOString(),
    delivered_at: null,
    read_at: null,
  }

  beforeEach(() => {
    // Create spies for MessageSDK
    mockMessageSDK = jasmine.createSpyObj<MessageSDK>('MessageSDK', [
      'create',
      'getById',
      'getConversation',
      'getUnread',
      'markAsRead',
      'markAsDelivered',
      'getMessagesBetweenUsers',
      'registerPushToken',
      'removePushToken',
      'getUserPushTokens',
    ])

    // Create spies for NotificationSDK
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
    service = new MessageService(mockMessageSDK, mockNotificationSDK)
  })

  // ============================================
  // SEND MESSAGE TESTS
  // ============================================

  describe('sendMessage()', () => {
    it('should send message successfully', async () => {
      const input: CreateMessageInput = {
        sender_id: mockSenderId,
        recipient_id: mockRecipientId,
        body: 'Hello!',
        booking_id: mockBookingId,
      }

      mockMessageSDK.create.and.returnValue(Promise.resolve(mockMessage))
      mockMessageSDK.getUserPushTokens.and.returnValue(Promise.resolve([]))
      mockNotificationSDK.create.and.returnValue(Promise.resolve({} as any))

      const result = await service.sendMessage(input)

      expect(mockMessageSDK.create).toHaveBeenCalledWith(input)
      expect(result).toEqual(mockMessage)
    })

    it('should throw error when sender equals recipient', async () => {
      const input: CreateMessageInput = {
        sender_id: mockSenderId,
        recipient_id: mockSenderId, // Same as sender
        body: 'Talking to myself',
        booking_id: mockBookingId,
      }

      await expectAsync(service.sendMessage(input)).toBeRejectedWithError(
        MessageError,
        'Cannot send message to yourself'
      )

      expect(mockMessageSDK.create).not.toHaveBeenCalled()
    })

    it('should create in-app notification after sending message', async () => {
      const input: CreateMessageInput = {
        sender_id: mockSenderId,
        recipient_id: mockRecipientId,
        body: 'Hello, is the car available?',
        booking_id: mockBookingId,
      }

      mockMessageSDK.create.and.returnValue(Promise.resolve(mockMessage))
      mockMessageSDK.getUserPushTokens.and.returnValue(Promise.resolve([]))
      mockNotificationSDK.create.and.returnValue(Promise.resolve({} as any))

      await service.sendMessage(input)

      // Wait for async notification (use setTimeout)
      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(mockNotificationSDK.create).toHaveBeenCalledWith({
        user_id: mockRecipientId,
        title: 'New Message',
        body: jasmine.stringContaining('Hello'),
        type: 'new_chat_message',
        metadata: {
          sender_id: mockSenderId,
        },
      })
    })

    it('should truncate long message preview to 100 chars in notification', async () => {
      const longMessage = 'a'.repeat(150)
      const input: CreateMessageInput = {
        sender_id: mockSenderId,
        recipient_id: mockRecipientId,
        body: longMessage,
        booking_id: mockBookingId,
      }

      mockMessageSDK.create.and.returnValue(
        Promise.resolve({ ...mockMessage, body: longMessage })
      )
      mockMessageSDK.getUserPushTokens.and.returnValue(Promise.resolve([]))
      mockNotificationSDK.create.and.returnValue(Promise.resolve({} as any))

      await service.sendMessage(input)
      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(mockNotificationSDK.create).toHaveBeenCalledWith(
        jasmine.objectContaining({
          body: longMessage.substring(0, 100),
        })
      )
    })

    it('should continue execution even if notification fails', async () => {
      const input: CreateMessageInput = {
        sender_id: mockSenderId,
        recipient_id: mockRecipientId,
        body: 'Hello!',
        booking_id: mockBookingId,
      }

      mockMessageSDK.create.and.returnValue(Promise.resolve(mockMessage))
      mockNotificationSDK.create.and.returnValue(
        Promise.reject(new Error('Notification service down'))
      )

      // Should NOT throw, message should still be created
      const result = await service.sendMessage(input)

      expect(result).toEqual(mockMessage)
      expect(mockMessageSDK.create).toHaveBeenCalled()
    })

    it('should get push tokens for recipient', async () => {
      const input: CreateMessageInput = {
        sender_id: mockSenderId,
        recipient_id: mockRecipientId,
        body: 'Hello!',
        booking_id: mockBookingId,
      }

      const mockPushTokens: PushTokenDTO[] = [
        {
          id: 'token-1',
          user_id: mockRecipientId,
          token: 'expo-token-abc123',
          created_at: new Date().toISOString(),
        },
      ]

      mockMessageSDK.create.and.returnValue(Promise.resolve(mockMessage))
      mockMessageSDK.getUserPushTokens.and.returnValue(Promise.resolve(mockPushTokens))
      mockNotificationSDK.create.and.returnValue(Promise.resolve({} as any))

      await service.sendMessage(input)
      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(mockMessageSDK.getUserPushTokens).toHaveBeenCalledWith(mockRecipientId)
    })
  })

  // ============================================
  // GET CONVERSATION TESTS
  // ============================================

  describe('getConversation()', () => {
    it('should get conversation by booking_id', async () => {
      const messages: MessageDTO[] = [mockMessage]

      mockMessageSDK.getConversation.and.returnValue(Promise.resolve(messages))

      const result = await service.getConversation({
        booking_id: mockBookingId,
      })

      expect(mockMessageSDK.getConversation).toHaveBeenCalledWith({
        booking_id: mockBookingId,
      })
      expect(result).toEqual(messages)
    })

    it('should get conversation by car_id', async () => {
      const carId = 'car-123'
      const messages: MessageDTO[] = [mockMessage]

      mockMessageSDK.getConversation.and.returnValue(Promise.resolve(messages))

      const result = await service.getConversation({ car_id: carId })

      expect(mockMessageSDK.getConversation).toHaveBeenCalledWith({
        car_id: carId,
      })
      expect(result).toEqual(messages)
    })

    it('should throw error when neither booking_id nor car_id provided', async () => {
      await expectAsync(service.getConversation({})).toBeRejectedWithError(
        MessageError,
        'Either booking_id or car_id must be provided'
      )

      expect(mockMessageSDK.getConversation).not.toHaveBeenCalled()
    })
  })

  // ============================================
  // UNREAD MESSAGES TESTS
  // ============================================

  describe('getUnreadMessages()', () => {
    it('should get unread messages for user', async () => {
      const unreadMessages: MessageDTO[] = [
        { ...mockMessage, read_at: null },
        { ...mockMessage, id: 'msg-002', read_at: null },
      ]

      mockMessageSDK.getUnread.and.returnValue(Promise.resolve(unreadMessages))

      const result = await service.getUnreadMessages(mockRecipientId)

      expect(mockMessageSDK.getUnread).toHaveBeenCalledWith(mockRecipientId)
      expect(result).toEqual(unreadMessages)
      expect(result.length).toBe(2)
    })

    it('should return empty array when no unread messages', async () => {
      mockMessageSDK.getUnread.and.returnValue(Promise.resolve([]))

      const result = await service.getUnreadMessages(mockRecipientId)

      expect(result).toEqual([])
    })
  })

  // ============================================
  // MARK AS READ TESTS
  // ============================================

  describe('markAsRead()', () => {
    it('should mark single message as read', async () => {
      const readMessage: MessageDTO = {
        ...mockMessage,
        read_at: new Date().toISOString(),
      }

      mockMessageSDK.markAsRead.and.returnValue(Promise.resolve(readMessage))

      const result = await service.markAsRead('msg-001')

      expect(mockMessageSDK.markAsRead).toHaveBeenCalledWith('msg-001')
      expect(result.read_at).not.toBeNull()
    })
  })

  describe('markConversationAsRead()', () => {
    it('should mark all unread messages in conversation as read', async () => {
      const conversationMessages: MessageDTO[] = [
        { ...mockMessage, id: 'msg-001', recipient_id: mockRecipientId, read_at: null },
        {
          ...mockMessage,
          id: 'msg-002',
          recipient_id: mockRecipientId,
          read_at: new Date().toISOString(),
        }, // Already read
        {
          ...mockMessage,
          id: 'msg-003',
          recipient_id: mockSenderId,
          read_at: null,
        }, // Different recipient
        { ...mockMessage, id: 'msg-004', recipient_id: mockRecipientId, read_at: null },
      ]

      mockMessageSDK.getConversation.and.returnValue(Promise.resolve(conversationMessages))
      mockMessageSDK.markAsRead.and.returnValue(
        Promise.resolve({ ...mockMessage, read_at: new Date().toISOString() })
      )

      await service.markConversationAsRead({
        booking_id: mockBookingId,
        userId: mockRecipientId,
      })

      expect(mockMessageSDK.getConversation).toHaveBeenCalledWith({
        booking_id: mockBookingId,
        car_id: undefined,
      })

      // Should only mark messages for mockRecipientId that are unread
      expect(mockMessageSDK.markAsRead).toHaveBeenCalledTimes(2)
      expect(mockMessageSDK.markAsRead).toHaveBeenCalledWith('msg-001')
      expect(mockMessageSDK.markAsRead).toHaveBeenCalledWith('msg-004')
      expect(mockMessageSDK.markAsRead).not.toHaveBeenCalledWith('msg-002') // Already read
      expect(mockMessageSDK.markAsRead).not.toHaveBeenCalledWith('msg-003') // Different recipient
    })

    it('should handle empty conversation', async () => {
      mockMessageSDK.getConversation.and.returnValue(Promise.resolve([]))

      await service.markConversationAsRead({
        booking_id: mockBookingId,
        userId: mockRecipientId,
      })

      expect(mockMessageSDK.markAsRead).not.toHaveBeenCalled()
    })

    it('should handle conversation with all messages already read', async () => {
      const readMessages: MessageDTO[] = [
        {
          ...mockMessage,
          id: 'msg-001',
          recipient_id: mockRecipientId,
          read_at: new Date().toISOString(),
        },
        {
          ...mockMessage,
          id: 'msg-002',
          recipient_id: mockRecipientId,
          read_at: new Date().toISOString(),
        },
      ]

      mockMessageSDK.getConversation.and.returnValue(Promise.resolve(readMessages))

      await service.markConversationAsRead({
        booking_id: mockBookingId,
        userId: mockRecipientId,
      })

      expect(mockMessageSDK.markAsRead).not.toHaveBeenCalled()
    })
  })

  // ============================================
  // PUSH TOKEN OPERATIONS TESTS
  // ============================================

  describe('registerPushToken()', () => {
    it('should register push token for user', async () => {
      const mockPushToken: PushTokenDTO = {
        id: 'token-1',
        user_id: mockSenderId,
        token: 'expo-token-abc123',
        created_at: new Date().toISOString(),
      }

      mockMessageSDK.registerPushToken.and.returnValue(Promise.resolve(mockPushToken))

      const result = await service.registerPushToken(mockSenderId, 'expo-token-abc123')

      expect(mockMessageSDK.registerPushToken).toHaveBeenCalledWith({
        user_id: mockSenderId,
        token: 'expo-token-abc123',
      })
      expect(result).toEqual(mockPushToken)
    })
  })

  describe('removePushToken()', () => {
    it('should remove push token', async () => {
      mockMessageSDK.removePushToken.and.returnValue(Promise.resolve())

      await service.removePushToken('expo-token-abc123')

      expect(mockMessageSDK.removePushToken).toHaveBeenCalledWith('expo-token-abc123')
    })
  })

  // ============================================
  // ERROR HANDLING TESTS
  // ============================================

  describe('Error Handling', () => {
    it('should throw MessageError when SDK throws', async () => {
      const input: CreateMessageInput = {
        sender_id: mockSenderId,
        recipient_id: mockRecipientId,
        body: 'Hello!',
        booking_id: mockBookingId,
      }

      mockMessageSDK.create.and.returnValue(
        Promise.reject(new Error('Database connection lost'))
      )

      await expectAsync(service.sendMessage(input)).toBeRejected()
    })

    it('should propagate MessageError with correct code', async () => {
      const input: CreateMessageInput = {
        sender_id: 'same-user',
        recipient_id: 'same-user',
        body: 'Hello!',
        booking_id: mockBookingId,
      }

      try {
        await service.sendMessage(input)
        fail('Should have thrown MessageError')
      } catch (error) {
        expect(error).toBeInstanceOf(MessageError)
        if (error instanceof MessageError) {
          expect(error.code).toBe(MessageErrorCode.INVALID_RECIPIENT)
          expect(error.statusCode).toBe(400)
        }
      }
    })
  })

  // ============================================
  // EDGE CASES
  // ============================================

  describe('Edge Cases', () => {
    it('should handle concurrent message sending', async () => {
      const input1: CreateMessageInput = {
        sender_id: mockSenderId,
        recipient_id: mockRecipientId,
        body: 'Message 1',
        booking_id: mockBookingId,
      }

      const input2: CreateMessageInput = {
        sender_id: mockSenderId,
        recipient_id: mockRecipientId,
        body: 'Message 2',
        booking_id: mockBookingId,
      }

      mockMessageSDK.create.and.returnValues(
        Promise.resolve({ ...mockMessage, id: 'msg-1', body: 'Message 1' }),
        Promise.resolve({ ...mockMessage, id: 'msg-2', body: 'Message 2' })
      )
      mockMessageSDK.getUserPushTokens.and.returnValue(Promise.resolve([]))
      mockNotificationSDK.create.and.returnValue(Promise.resolve({} as any))

      const results = await Promise.all([
        service.sendMessage(input1),
        service.sendMessage(input2),
      ])

      expect(results.length).toBe(2)
      expect(results[0].id).toBe('msg-1')
      expect(results[1].id).toBe('msg-2')
    })

    it('should handle very long message body', async () => {
      const longMessage = 'a'.repeat(10000)
      const input: CreateMessageInput = {
        sender_id: mockSenderId,
        recipient_id: mockRecipientId,
        body: longMessage,
        booking_id: mockBookingId,
      }

      mockMessageSDK.create.and.returnValue(
        Promise.resolve({ ...mockMessage, body: longMessage })
      )
      mockMessageSDK.getUserPushTokens.and.returnValue(Promise.resolve([]))
      mockNotificationSDK.create.and.returnValue(Promise.resolve({} as any))

      const result = await service.sendMessage(input)

      expect(result.body.length).toBe(10000)
      expect(mockMessageSDK.create).toHaveBeenCalled()
    })

    it('should handle messages with only car_id (no booking)', async () => {
      const input: CreateMessageInput = {
        sender_id: mockSenderId,
        recipient_id: mockRecipientId,
        body: 'Is this car available?',
        car_id: 'car-123',
      }

      const carMessage: MessageDTO = {
        ...mockMessage,
        booking_id: null,
        car_id: 'car-123',
      }

      mockMessageSDK.create.and.returnValue(Promise.resolve(carMessage))
      mockMessageSDK.getUserPushTokens.and.returnValue(Promise.resolve([]))
      mockNotificationSDK.create.and.returnValue(Promise.resolve({} as any))

      const result = await service.sendMessage(input)

      expect(result.car_id).toBe('car-123')
      expect(result.booking_id).toBeNull()
    })
  })
})
/* eslint-enable @typescript-eslint/unbound-method -- Re-enable after test file */
