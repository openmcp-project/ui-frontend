import { z } from 'zod';

export const MeResponseSchema = z.object({
  isAuthenticated: z.boolean(),
});
