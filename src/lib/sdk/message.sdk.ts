/**
 * Message SDK
 * Handles in-app messaging operations between users
 */

import { toError } from '../errors'
import { supabase } from '../supabase'

import type {
  MessageDTO,
  CreateMessageInput,
  GetConversationInput,
  PushTokenDTO,
  RegisterPushTokenInput,
} from '@/types'
import {
  parseMessage,
  parsePushToken,
  CreateMessageInputSchema,
  GetConversationInputSchema,
  RegisterPushTokenInputSchema,
} from '@/types'

import { BaseSDK } from './base.sdk'

export class MessageSDK extends BaseSDK {
  /**
   * Get message by ID
   */
  async getById(id: string): Promise<MessageDTO> {
    try {
      const { data, error } = await this.supabase
        .from('messages')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        throw toError(error)
      }

      if (!data) {
        throw new Error('Message not found')
      }

      return parseMessage(data)
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Send a message
   */
  async create(input: CreateMessageInput): Promise<MessageDTO> {
    // Validate input
    const validData = CreateMessageInputSchema.parse(input)

    try {
      const { data, error } = await this.supabase
        .from('messages')
        .insert({
          sender_id: validData.sender_id,
          recipient_id: validData.recipient_id,
          body: validData.body,
          booking_id: validData.booking_id ?? null,
          car_id: validData.car_id ?? null,
        })
        .select()
        .single()

      if (error) {
        throw toError(error)
      }

      if (!data) {
        throw new Error('Failed to create message')
      }

      return parseMessage(data)
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Get conversation messages
   * Either by booking_id or car_id
   */
  async getConversation(input: GetConversationInput): Promise<MessageDTO[]> {
    // Validate input
    const validData = GetConversationInputSchema.parse(input)

    try {
      let query = this.supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true })

      if (validData.booking_id) {
        query = query.eq('booking_id', validData.booking_id)
      } else if (validData.car_id) {
        query = query.eq('car_id', validData.car_id)
      } else {
        throw new Error('Either booking_id or car_id must be provided')
      }

      const { data, error } = await query

      if (error) {
        throw toError(error)
      }

      return (data ?? []).map(parseMessage)
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Get unread messages for user
   */
  async getUnread(userId: string): Promise<MessageDTO[]> {
    try {
      const { data, error } = await this.supabase
        .from('messages')
        .select('*')
        .eq('recipient_id', userId)
        .is('read_at', null)
        .order('created_at', { ascending: false })

      if (error) {
        throw toError(error)
      }

      return (data ?? []).map(parseMessage)
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string): Promise<MessageDTO> {
    try {
      const { data, error } = await this.supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('id', messageId)
        .select()
        .single()

      if (error) {
        throw toError(error)
      }

      if (!data) {
        throw new Error('Message not found')
      }

      return parseMessage(data)
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Mark message as delivered
   */
  async markAsDelivered(messageId: string): Promise<MessageDTO> {
    try {
      const { data, error} = await this.supabase
        .from('messages')
        .update({ delivered_at: new Date().toISOString() })
        .eq('id', messageId)
        .select()
        .single()

      if (error) {
        throw toError(error)
      }

      if (!data) {
        throw new Error('Message not found')
      }

      return parseMessage(data)
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Get messages between two users
   */
  async getMessagesBetweenUsers(
    userId1: string,
    userId2: string
  ): Promise<MessageDTO[]> {
    try {
      const { data, error } = await this.supabase
        .from('messages')
        .select('*')
        .or(
          `and(sender_id.eq.${userId1},recipient_id.eq.${userId2}),and(sender_id.eq.${userId2},recipient_id.eq.${userId1})`
        )
        .order('created_at', { ascending: true })

      if (error) {
        throw toError(error)
      }

      return (data ?? []).map(parseMessage)
    } catch (e) {
      throw toError(e)
    }
  }

  // ============================================
  // PUSH TOKEN OPERATIONS
  // ============================================

  /**
   * Register push token for user
   */
  async registerPushToken(input: RegisterPushTokenInput): Promise<PushTokenDTO> {
    // Validate input
    const validData = RegisterPushTokenInputSchema.parse(input)

    try {
      const { data, error } = await this.supabase
        .from('push_tokens')
        .upsert(
          {
            user_id: validData.user_id,
            token: validData.token,
          },
          {
            onConflict: 'token',
          }
        )
        .select()
        .single()

      if (error) {
        throw toError(error)
      }

      if (!data) {
        throw new Error('Failed to register push token')
      }

      return parsePushToken(data)
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Remove push token
   */
  async removePushToken(token: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('push_tokens')
        .delete()
        .eq('token', token)

      if (error) {
        throw toError(error)
      }
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Get user push tokens
   */
  async getUserPushTokens(userId: string): Promise<PushTokenDTO[]> {
    try {
      const { data, error } = await this.supabase
        .from('push_tokens')
        .select('*')
        .eq('user_id', userId)

      if (error) {
        throw toError(error)
      }

      return (data ?? []).map(parsePushToken)
    } catch (e) {
      throw toError(e)
    }
  }
}

// Singleton instance
export const messageSDK = new MessageSDK(supabase)
