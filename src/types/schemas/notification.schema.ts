/**
 * Notification Input/Output Schemas
 * Validation schemas for Notification operations
 */

import { z } from 'zod'

// ============================================
// ENUMS
// ============================================

export const NotificationTypeEnum = z.enum([
  'new_booking_for_owner',
  'booking_cancelled_for_owner',
  'booking_cancelled_for_renter',
  'new_chat_message',
  'payment_successful',
  'payout_successful',
  'inspection_reminder',
  'generic_announcement',
])

// Note: NotificationType is exported from database.types.ts

// ============================================
// INPUT SCHEMAS
// ============================================

/**
 * Schema for creating a notification
 */
export const CreateNotificationInputSchema = z.object({
  user_id: z.string().uuid(),
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(500),
  type: NotificationTypeEnum,
  cta_link: z.string().url().optional(),
  metadata: z.record(z.unknown()).optional(),
})

export type CreateNotificationInput = z.infer<
  typeof CreateNotificationInputSchema
>

/**
 * Schema for marking notification as read
 */
export const MarkNotificationAsReadInputSchema = z.object({
  notification_id: z.string().uuid(),
})

export type MarkNotificationAsReadInput = z.infer<
  typeof MarkNotificationAsReadInputSchema
>

/**
 * Schema for marking all notifications as read
 */
export const MarkAllNotificationsAsReadInputSchema = z.object({
  user_id: z.string().uuid(),
})

export type MarkAllNotificationsAsReadInput = z.infer<
  typeof MarkAllNotificationsAsReadInputSchema
>

/**
 * Schema for deleting a notification
 */
export const DeleteNotificationInputSchema = z.object({
  notification_id: z.string().uuid(),
})

export type DeleteNotificationInput = z.infer<
  typeof DeleteNotificationInputSchema
>

/**
 * Schema for getting user notifications with filters
 */
export const GetUserNotificationsInputSchema = z.object({
  user_id: z.string().uuid(),
  unread_only: z.boolean().default(false),
  type: NotificationTypeEnum.optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
})

export type GetUserNotificationsInput = z.infer<
  typeof GetUserNotificationsInputSchema
>

// ============================================
// BULK NOTIFICATION SCHEMA
// ============================================

/**
 * Schema for sending bulk notifications
 */
export const SendBulkNotificationInputSchema = z.object({
  user_ids: z.array(z.string().uuid()).min(1).max(1000),
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(500),
  type: NotificationTypeEnum,
  cta_link: z.string().url().optional(),
  metadata: z.record(z.unknown()).optional(),
})

export type SendBulkNotificationInput = z.infer<
  typeof SendBulkNotificationInputSchema
>
