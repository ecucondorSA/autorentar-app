/**
 * Message Input/Output Schemas
 * Validation schemas for Message operations
 */

import { z } from 'zod'

// ============================================
// INPUT SCHEMAS
// ============================================

/**
 * Schema for creating a new message
 */
export const CreateMessageInputSchema = z
  .object({
    sender_id: z.string().uuid(),
    recipient_id: z.string().uuid(),
    body: z.string().min(1).max(10000),
    booking_id: z.string().uuid().optional(),
    car_id: z.string().uuid().optional(),
  })
  .refine((data) => data.booking_id ?? data.car_id, {
    message: 'Either booking_id or car_id must be provided',
  })

export type CreateMessageInput = z.infer<typeof CreateMessageInputSchema>

/**
 * Schema for marking message as read
 */
export const MarkMessageAsReadInputSchema = z.object({
  message_id: z.string().uuid(),
})

export type MarkMessageAsReadInput = z.infer<
  typeof MarkMessageAsReadInputSchema
>

/**
 * Schema for getting conversation
 */
export const GetConversationInputSchema = z.object({
  booking_id: z.string().uuid().optional(),
  car_id: z.string().uuid().optional(),
})

export type GetConversationInput = z.infer<typeof GetConversationInputSchema>

// ============================================
// PUSH TOKEN SCHEMAS
// ============================================

/**
 * Schema for registering push token
 */
export const RegisterPushTokenInputSchema = z.object({
  user_id: z.string().uuid(),
  token: z.string().min(1),
})

export type RegisterPushTokenInput = z.infer<
  typeof RegisterPushTokenInputSchema
>

/**
 * Schema for removing push token
 */
export const RemovePushTokenInputSchema = z.object({
  token: z.string().min(1),
})

export type RemovePushTokenInput = z.infer<typeof RemovePushTokenInputSchema>
