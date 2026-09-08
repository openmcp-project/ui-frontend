import { z } from 'zod';

export const UserSchema = z.object({
  sub: z.string().min(1, 'sub claim is required.'),
  email: z.email('Invalid email format.'),
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
