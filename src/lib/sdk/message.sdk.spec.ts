/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-argument -- Test file */
/**
 * MessageSDK Tests
 * Tests completos para validar funcionalidad de mensajería (feature horizontal)
 *
 * Principio: Mejor 2 tests funcionando que se solapen, que gaps de coverage
 */

import type { SupabaseClient } from '@supabase/supabase-js'

import type { MessageDTO, CreateMessageInput, GetConversationInput, RegisterPushTokenInput, PushTokenDTO } from '@/types'

import { MessageSDK } from './message.sdk'

describe('MessageSDK (Feature Horizontal)', () => {
  let sdk: MessageSDK
  let mockSupabase: jasmine.SpyObj<SupabaseClient>

  // Mock data
  const mockMessage: MessageDTO = {
    id: 'msg-123',
    sender_id: 'user-sender',
    recipient_id: 'user-recipient',
    body: 'Test message',
    booking_id: 'booking-123',
    car_id: null,
    created_at: '2025-10-30T10:00:00Z',
    delivered_at: null,
    read_at: null,
  }

  const mockPushToken: PushTokenDTO = {
    id: 'token-123',
    user_id: 'user-123',
    token: 'expo-push-token',
    created_at: '2025-10-30T10:00:00Z',
  }

  beforeEach(() => {
    // Create Supabase mock
    mockSupabase = jasmine.createSpyObj('SupabaseClient', ['from', 'auth'])

    // Inject mock
    sdk = new MessageSDK(mockSupabase as any)
  })

  // ============================================
  // CREATE MESSAGE TESTS
  // ============================================

  describe('create()', () => {
    it('should send message successfully', async () => {
      // Arrange
      const input: CreateMessageInput = {
        sender_id: 'user-sender',
        recipient_id: 'user-recipient',
        body: 'Hello World',
        booking_id: 'booking-123',
      }

      const mockChain = {
        insert: jasmine.createSpy('insert').and.returnValue({
          select: jasmine.createSpy('select').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(
              Promise.resolve({ data: mockMessage, error: null })
            ),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      // Act
      const result = await sdk.create(input)

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith('messages')
      expect(mockChain.insert).toHaveBeenCalledWith({
        sender_id: input.sender_id,
        recipient_id: input.recipient_id,
        body: input.body,
        booking_id: input.booking_id,
        car_id: null,
      })
      expect(result).toEqual(mockMessage)
    })

    it('should send message with car_id instead of booking_id', async () => {
      // Arrange
      const input: CreateMessageInput = {
        sender_id: 'user-sender',
        recipient_id: 'user-recipient',
        body: 'Interested in your car',
        car_id: 'car-456',
      }

      const mockChain = {
        insert: jasmine.createSpy('insert').and.returnValue({
          select: jasmine.createSpy('select').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(
              Promise.resolve({ data: { ...mockMessage, car_id: 'car-456', booking_id: null }, error: null })
            ),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      // Act
      const result = await sdk.create(input)

      // Assert
      expect(mockChain.insert).toHaveBeenCalledWith({
        sender_id: input.sender_id,
        recipient_id: input.recipient_id,
        body: input.body,
        booking_id: null,
        car_id: input.car_id,
      })
      expect(result.car_id).toBe('car-456')
      expect(result.booking_id).toBeNull()
    })

    it('should throw error when message creation fails', async () => {
      // Arrange
      const input: CreateMessageInput = {
        sender_id: 'user-sender',
        recipient_id: 'user-recipient',
        body: 'Test',
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
      // Arrange - Invalid input (empty body)
      const invalidInput = {
        sender_id: 'user-sender',
        recipient_id: 'user-recipient',
        body: '', // Empty body should fail validation
      } as CreateMessageInput

      // Act & Assert
      await expectAsync(sdk.create(invalidInput)).toBeRejected()
    })
  })

  // ============================================
  // GET MESSAGE TESTS
  // ============================================

  describe('getById()', () => {
    it('should get message by id successfully', async () => {
      // Arrange
      const messageId = 'msg-123'

      const mockChain = {
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(
              Promise.resolve({ data: mockMessage, error: null })
            ),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      // Act
      const result = await sdk.getById(messageId)

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith('messages')
      expect(mockChain.select).toHaveBeenCalledWith('*')
      expect(result).toEqual(mockMessage)
    })

    it('should throw error when message not found', async () => {
      // Arrange
      const messageId = 'non-existent'

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
      await expectAsync(sdk.getById(messageId)).toBeRejectedWithError('Message not found')
    })
  })

  // ============================================
  // GET CONVERSATION TESTS
  // ============================================

  describe('getConversation()', () => {
    it('should get messages by booking_id', async () => {
      // Arrange
      const input: GetConversationInput = {
        booking_id: 'booking-123',
      }

      const messages = [mockMessage, { ...mockMessage, id: 'msg-456' }]

      const mockChain = {
        select: jasmine.createSpy('select').and.returnValue({
          order: jasmine.createSpy('order').and.returnValue({
            eq: jasmine.createSpy('eq').and.returnValue(
              Promise.resolve({ data: messages, error: null })
            ),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      // Act
      const result = await sdk.getConversation(input)

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith('messages')
      expect(result).toEqual(messages)
      expect(result.length).toBe(2)
    })

    it('should get messages by car_id', async () => {
      // Arrange
      const input: GetConversationInput = {
        car_id: 'car-456',
      }

      const messages = [{ ...mockMessage, car_id: 'car-456', booking_id: null }]

      const mockChain = {
        select: jasmine.createSpy('select').and.returnValue({
          order: jasmine.createSpy('order').and.returnValue({
            eq: jasmine.createSpy('eq').and.returnValue(
              Promise.resolve({ data: messages, error: null })
            ),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      // Act
      const result = await sdk.getConversation(input)

      // Assert
      expect(result).toEqual(messages)
    })

    it('should throw error when neither booking_id nor car_id provided', async () => {
      // Arrange
      const input: GetConversationInput = {} // Empty input

      // Act & Assert
      await expectAsync(sdk.getConversation(input)).toBeRejected()
    })

    it('should return empty array when no messages found', async () => {
      // Arrange
      const input: GetConversationInput = {
        booking_id: 'booking-123',
      }

      const mockChain = {
        select: jasmine.createSpy('select').and.returnValue({
          order: jasmine.createSpy('order').and.returnValue({
            eq: jasmine.createSpy('eq').and.returnValue(
              Promise.resolve({ data: [], error: null })
            ),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      // Act
      const result = await sdk.getConversation(input)

      // Assert
      expect(result).toEqual([])
    })
  })

  // ============================================
  // GET UNREAD MESSAGES TESTS
  // ============================================

  describe('getUnread()', () => {
    it('should get unread messages for user', async () => {
      // Arrange
      const userId = 'user-recipient'
      const unreadMessages = [
        mockMessage,
        { ...mockMessage, id: 'msg-789', read_at: null },
      ]

      const mockChain = {
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            is: jasmine.createSpy('is').and.returnValue({
              order: jasmine.createSpy('order').and.returnValue(
                Promise.resolve({ data: unreadMessages, error: null })
              ),
            }),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      // Act
      const result = await sdk.getUnread(userId)

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith('messages')
      expect(result).toEqual(unreadMessages)
      expect(result.length).toBe(2)
    })

    it('should return empty array when no unread messages', async () => {
      // Arrange
      const userId = 'user-recipient'

      const mockChain = {
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            is: jasmine.createSpy('is').and.returnValue({
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
    it('should mark message as read successfully', async () => {
      // Arrange
      const messageId = 'msg-123'
      const readMessage = { ...mockMessage, read_at: '2025-10-30T10:30:00Z' }

      const mockChain = {
        update: jasmine.createSpy('update').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            select: jasmine.createSpy('select').and.returnValue({
              single: jasmine.createSpy('single').and.returnValue(
                Promise.resolve({ data: readMessage, error: null })
              ),
            }),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      // Act
      const result = await sdk.markAsRead(messageId)

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith('messages')
      expect(mockChain.update).toHaveBeenCalledWith(jasmine.objectContaining({
        read_at: jasmine.any(String),
      }))
      expect(result.read_at).not.toBeNull()
    })

    it('should throw error when message not found', async () => {
      // Arrange
      const messageId = 'non-existent'

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
      await expectAsync(sdk.markAsRead(messageId)).toBeRejectedWithError('Message not found')
    })
  })

  // ============================================
  // MARK AS DELIVERED TESTS
  // ============================================

  describe('markAsDelivered()', () => {
    it('should mark message as delivered successfully', async () => {
      // Arrange
      const messageId = 'msg-123'
      const deliveredMessage = { ...mockMessage, delivered_at: '2025-10-30T10:15:00Z' }

      const mockChain = {
        update: jasmine.createSpy('update').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            select: jasmine.createSpy('select').and.returnValue({
              single: jasmine.createSpy('single').and.returnValue(
                Promise.resolve({ data: deliveredMessage, error: null })
              ),
            }),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      // Act
      const result = await sdk.markAsDelivered(messageId)

      // Assert
      expect(result.delivered_at).not.toBeNull()
    })
  })

  // ============================================
  // GET MESSAGES BETWEEN USERS TESTS
  // ============================================

  describe('getMessagesBetweenUsers()', () => {
    it('should get all messages between two users', async () => {
      // Arrange
      const userId1 = 'user-alice'
      const userId2 = 'user-bob'

      const messages = [
        { ...mockMessage, sender_id: userId1, recipient_id: userId2 },
        { ...mockMessage, id: 'msg-456', sender_id: userId2, recipient_id: userId1 },
      ]

      const mockChain = {
        select: jasmine.createSpy('select').and.returnValue({
          or: jasmine.createSpy('or').and.returnValue({
            order: jasmine.createSpy('order').and.returnValue(
              Promise.resolve({ data: messages, error: null })
            ),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      // Act
      const result = await sdk.getMessagesBetweenUsers(userId1, userId2)

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith('messages')
      expect(result.length).toBe(2)
      // Verify bidirectional messages
      expect(result.some(m => m.sender_id === userId1 && m.recipient_id === userId2)).toBeTrue()
      expect(result.some(m => m.sender_id === userId2 && m.recipient_id === userId1)).toBeTrue()
    })

    it('should return empty array when no messages between users', async () => {
      // Arrange
      const userId1 = 'user-alice'
      const userId2 = 'user-charlie'

      const mockChain = {
        select: jasmine.createSpy('select').and.returnValue({
          or: jasmine.createSpy('or').and.returnValue({
            order: jasmine.createSpy('order').and.returnValue(
              Promise.resolve({ data: [], error: null })
            ),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      // Act
      const result = await sdk.getMessagesBetweenUsers(userId1, userId2)

      // Assert
      expect(result).toEqual([])
    })
  })

  // ============================================
  // PUSH TOKEN TESTS
  // ============================================

  describe('registerPushToken()', () => {
    it('should register push token successfully', async () => {
      // Arrange
      const input: RegisterPushTokenInput = {
        user_id: 'user-123',
        token: 'expo-push-token-xyz',
      }

      const mockChain = {
        upsert: jasmine.createSpy('upsert').and.returnValue({
          select: jasmine.createSpy('select').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(
              Promise.resolve({ data: mockPushToken, error: null })
            ),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      // Act
      const result = await sdk.registerPushToken(input)

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith('push_tokens')
      expect(mockChain.upsert).toHaveBeenCalledWith(
        { user_id: input.user_id, token: input.token },
        { onConflict: 'token' }
      )
      expect(result).toEqual(mockPushToken)
    })

    it('should validate push token input', async () => {
      // Arrange - Invalid input (missing user_id)
      const invalidInput = {
        token: 'expo-token',
      } as RegisterPushTokenInput

      // Act & Assert
      await expectAsync(sdk.registerPushToken(invalidInput)).toBeRejected()
    })
  })

  describe('removePushToken()', () => {
    it('should remove push token successfully', async () => {
      // Arrange
      const token = 'expo-token-to-remove'

      const mockChain = {
        delete: jasmine.createSpy('delete').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue(
            Promise.resolve({ error: null })
          ),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      // Act
      await sdk.removePushToken(token)

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith('push_tokens')
      expect(mockChain.delete).toHaveBeenCalled()
    })
  })

  describe('getUserPushTokens()', () => {
    it('should get all push tokens for user', async () => {
      // Arrange
      const userId = 'user-123'
      const tokens = [
        mockPushToken,
        { ...mockPushToken, id: 'token-456', token: 'expo-token-2' },
      ]

      const mockChain = {
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue(
            Promise.resolve({ data: tokens, error: null })
          ),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      // Act
      const result = await sdk.getUserPushTokens(userId)

      // Assert
      expect(result.length).toBe(2)
      expect(result[0].user_id).toBe(userId)
    })
  })

  // ============================================
  // INTEGRATION / EDGE CASE TESTS
  // ============================================

  describe('Edge Cases', () => {
    it('should handle concurrent message sends', async () => {
      // Arrange
      const input1: CreateMessageInput = {
        sender_id: 'user-1',
        recipient_id: 'user-2',
        body: 'Message 1',
      }

      const input2: CreateMessageInput = {
        sender_id: 'user-1',
        recipient_id: 'user-2',
        body: 'Message 2',
      }

      const mockChain = {
        insert: jasmine.createSpy('insert').and.returnValue({
          select: jasmine.createSpy('select').and.returnValue({
            single: jasmine.createSpy('single').and.returnValues(
              Promise.resolve({ data: { ...mockMessage, id: 'msg-1' }, error: null }),
              Promise.resolve({ data: { ...mockMessage, id: 'msg-2' }, error: null })
            ),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      // Act
      const [result1, result2] = await Promise.all([
        sdk.create(input1),
        sdk.create(input2),
      ])

      // Assert
      expect(result1.id).toBe('msg-1')
      expect(result2.id).toBe('msg-2')
    })

    it('should handle very long message body', async () => {
      // Arrange
      const longBody = 'A'.repeat(5000) // 5000 characters
      const input: CreateMessageInput = {
        sender_id: 'user-1',
        recipient_id: 'user-2',
        body: longBody,
      }

      const mockChain = {
        insert: jasmine.createSpy('insert').and.returnValue({
          select: jasmine.createSpy('select').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(
              Promise.resolve({ data: { ...mockMessage, body: longBody }, error: null })
            ),
          }),
        }),
      }

      mockSupabase.from = jasmine.createSpy('from').and.returnValue(mockChain as any)

      // Act
      const result = await sdk.create(input)

      // Assert
      expect(result.body.length).toBe(5000)
    })
  })
})
