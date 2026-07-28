import { z } from 'zod'

export const loginRequestSchema = z.object({
  pin: z
    .string()
    .min(4, 'PIN must be at least 4 digits')
    .max(20, 'PIN must be at most 20 digits'),
})

export const loginResponseSchema = z.object({
  token: z.string(),
})

export const authStatusResponseSchema = z.object({
  authenticated: z.boolean(),
})

export type LoginRequest = z.infer<typeof loginRequestSchema>
export type LoginResponse = z.infer<typeof loginResponseSchema>
export type AuthStatusResponse = z.infer<typeof authStatusResponseSchema>
