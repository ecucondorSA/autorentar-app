/**
 * MessageService
 * Business logic layer for messaging operations
 *
 * Responsibilities:
 * - Handle in-app messaging between users
 * - Send push notifications
 * - Manage message delivery and read receipts
 * - Integrate with notification system
 */

import { messageSDK, type MessageSDK } from '@/lib/sdk/message.sdk'
import { notificationSDK, type NotificationSDK } from '@/lib/sdk/notification.sdk'
import type { MessageDTO, CreateMessageInput, PushTokenDTO } from '@/types'

import { toError } from '../lib/errors'

// ============================================
// MESSAGE SERVICE ERRORS
// ============================================

export enum MessageErrorCode {
  MESSAGE_NOT_FOUND = 'MESSAGE_NOT_FOUND',
  INVALID_RECIPIENT = 'INVALID_RECIPIENT',
  CONVERSATION_NOT_FOUND = 'CONVERSATION_NOT_FOUND',
  SEND_FAILED = 'SEND_FAILED',
  PUSH_NOTIFICATION_FAILED = 'PUSH_NOTIFICATION_FAILED',
}

export class MessageError extends Error {
  constructor(
    message: string,
    public code: MessageErrorCode,
    public statusCode: number = 400
  ) {
    super(message)
    this.name = 'MessageError'
    Object.setPrototypeOf(this, MessageError.prototype)
  }
}

// ============================================
// MESSAGE SERVICE
// ============================================

export class MessageService {
  constructor(
    private readonly messageSDK: MessageSDK,
    private readonly notificationSDK: NotificationSDK
  ) {}

  /**
   * Send a message
   * Creates message and sends push notification
   */
  async sendMessage(input: CreateMessageInput): Promise<MessageDTO> {
    try {
      // 1. Validate sender != recipient
      if (input.sender_id === input.recipient_id) {
        throw new MessageError(
          'Cannot send message to yourself',
          MessageErrorCode.INVALID_RECIPIENT,
          400
        )
      }

      // 2. Create message
      const message = await this.messageSDK.create(input)

      // 3. Send push notification to recipient (non-blocking)
      void this.sendMessageNotification(
        input.recipient_id,
        input.sender_id,
        message.body
      ).catch((err) => {
        console.error('Failed to send push notification:', err)
      })

      return message
    } catch (error) {
      if (error instanceof MessageError) {
        throw error
      }
      throw toError(error)
    }
  }

  /**
   * Get conversation messages
   */
  async getConversation(input: {
    booking_id?: string
    car_id?: string
  }): Promise<MessageDTO[]> {
    try {
      if (!input.booking_id && !input.car_id) {
        throw new MessageError(
          'Either booking_id or car_id must be provided',
          MessageErrorCode.CONVERSATION_NOT_FOUND,
          400
        )
      }

      const messages = await this.messageSDK.getConversation(input)
      return messages
    } catch (error) {
      if (error instanceof MessageError) {
        throw error
      }
      throw toError(error)
    }
  }

  /**
   * Get unread messages for user
   */
  async getUnreadMessages(userId: string): Promise<MessageDTO[]> {
    try {
      const messages = await this.messageSDK.getUnread(userId)
      return messages
    } catch (error) {
      throw toError(error)
    }
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string): Promise<MessageDTO> {
    try {
      const message = await this.messageSDK.markAsRead(messageId)
      return message
    } catch (error) {
      throw toError(error)
    }
  }

  /**
   * Mark all conversation messages as read
   */
  async markConversationAsRead(input: {
    booking_id?: string
    car_id?: string
    userId: string
  }): Promise<void> {
    try {
      // Get all messages in conversation
      const messages = await this.messageSDK.getConversation({
        booking_id: input.booking_id,
        car_id: input.car_id,
      })

      // Mark all unread messages for this user as read
      const unreadMessages = messages.filter(
        (msg) => msg.recipient_id === input.userId && !msg.read_at
      )

      await Promise.all(
        unreadMessages.map((msg) => this.messageSDK.markAsRead(msg.id))
      )
    } catch (error) {
      throw toError(error)
    }
  }

  // ============================================
  // PUSH NOTIFICATION OPERATIONS
  // ============================================

  /**
   * Register push token for user
   */
  async registerPushToken(
    userId: string,
    token: string
  ): Promise<PushTokenDTO> {
    try {
      const pushToken = await this.messageSDK.registerPushToken({
        user_id: userId,
        token,
      })
      return pushToken
    } catch (error) {
      throw toError(error)
    }
  }

  /**
   * Remove push token
   */
  async removePushToken(token: string): Promise<void> {
    try {
      await this.messageSDK.removePushToken(token)
    } catch (error) {
      throw toError(error)
    }
  }

  /**
   * Send message notification
   * Private helper to send push notification
   */
  private async sendMessageNotification(
    recipientId: string,
    senderId: string,
    messagePreview: string
  ): Promise<void> {
    try {
      // Create in-app notification
      await this.notificationSDK.create({
        user_id: recipientId,
        title: 'New Message',
        body: messagePreview.substring(0, 100),
        type: 'new_chat_message',
        metadata: {
          sender_id: senderId,
        },
      })

      // TODO: Send actual push notification via FCM/APNS
      // Get user's push tokens
      const pushTokens = await this.messageSDK.getUserPushTokens(recipientId)

      if (pushTokens.length > 0) {
        // TODO: Integrate with push notification service (FCM, OneSignal, etc.)
        console.log('Would send push notification to:', pushTokens)
      }
    } catch (error) {
      // Non-critical error, log and continue
      console.error('Failed to send message notification:', error)
    }
  }

  /**
   * Send email notification (future implementation)
   */
  async sendEmail(
    to: string,
    subject: string,
    body: string
  ): Promise<void> {
    // TODO: Integrate with email service (SendGrid, Resend, etc.)
    console.log('Would send email to:', to, subject, body)
  }

  /**
   * Send SMS notification (future implementation)
   */
  async sendSMS(phoneNumber: string, message: string): Promise<void> {
    // TODO: Integrate with SMS service (Twilio, etc.)
    console.log('Would send SMS to:', phoneNumber, message)
  }
}

// Singleton instance
export const messageService = new MessageService(messageSDK, notificationSDK)
