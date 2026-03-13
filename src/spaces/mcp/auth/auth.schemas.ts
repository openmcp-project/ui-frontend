import { z } from 'zod';

/**
 * Response schema for /auth/mcp/me endpoint
 * Returns authentication status and token expiration timestamp
 */
export const MeResponseSchema = z.object({
  isAuthenticated: z.boolean(),
  tokenExpiresAt: z.number().int().positive().nullable(),
});
