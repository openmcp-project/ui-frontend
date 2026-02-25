import { z } from 'zod';

export const UserSchema = z.object({
  email: z.string().email('Invalid email format.'),
});

/**
 * Response schema for /auth/onboarding/me endpoint
 * Returns authentication status, user information and token expiration timestamp
 */
export const MeResponseSchema = z.object({
  isAuthenticated: z.boolean(),
  user: UserSchema.nullable(),
  tokenExpiresAt: z.number().int().positive().nullable(),
});

export type User = z.infer<typeof UserSchema>;
