/**
 * Notification SDK
 * Handles user notifications and notification operations
 */

import { toError } from '../errors'
import { supabase } from '../supabase'

import type {
  NotificationDTO,
  CreateNotificationInput,
  GetUserNotificationsInput,
  Json,
} from '@/types'
import {
  parseNotification,
  CreateNotificationInputSchema,
  GetUserNotificationsInputSchema,
} from '@/types'

import { BaseSDK } from './base.sdk'

export class NotificationSDK extends BaseSDK {
  /**
   * Get notification by ID
   */
  async getById(id: string): Promise<NotificationDTO> {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        throw toError(error)
      }

      if (!data) {
        throw new Error('Notification not found')
      }

      return parseNotification(data)
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Create a notification
   */
  async create(input: CreateNotificationInput): Promise<NotificationDTO> {
    // Validate input
    const validData = CreateNotificationInputSchema.parse(input)

    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .insert({
          user_id: validData.user_id,
          title: validData.title,
          body: validData.body,
          type: validData.type,
          cta_link: validData.cta_link ?? null,
          metadata: (validData.metadata ?? null) as Json | null,
        })
        .select()
        .single()

      if (error) {
        throw toError(error)
      }

      if (!data) {
        throw new Error('Failed to create notification')
      }

      return parseNotification(data)
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(
    input: GetUserNotificationsInput
  ): Promise<NotificationDTO[]> {
    // Validate input
    const validData = GetUserNotificationsInputSchema.parse(input)

    try {
      let query = this.supabase
        .from('notifications')
        .select('*')
        .eq('user_id', validData.user_id)
        .order('created_at', { ascending: false })
        .range(validData.offset, validData.offset + validData.limit - 1)

      // Filter by unread
      if (validData.unread_only) {
        query = query.eq('is_read', false)
      }

      // Filter by type
      if (validData.type) {
        query = query.eq('type', validData.type)
      }

      const { data, error } = await query

      if (error) {
        throw toError(error)
      }

      return (data ?? []).map(parseNotification)
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<NotificationDTO> {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .select()
        .single()

      if (error) {
        throw toError(error)
      }

      if (!data) {
        throw new Error('Notification not found')
      }

      return parseNotification(data)
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Mark all user notifications as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false)

      if (error) {
        throw toError(error)
      }
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Delete notification
   */
  async delete(notificationId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) {
        throw toError(error)
      }
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Get unread count for user
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false)

      if (error) {
        throw toError(error)
      }

      return count ?? 0
    } catch (e) {
      throw toError(e)
    }
  }

  /**
   * Delete all read notifications for user
   */
  async deleteAllRead(userId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)
        .eq('is_read', true)

      if (error) {
        throw toError(error)
      }
    } catch (e) {
      throw toError(e)
    }
  }
}

// Singleton instance
export const notificationSDK = new NotificationSDK(supabase)
