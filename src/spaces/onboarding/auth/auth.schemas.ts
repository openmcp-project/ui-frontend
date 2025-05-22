import { z } from 'zod';

export const UserSchema = z.object({
  email: z.string().email('Invalid email format.'),
});

export const MeResponseSchema = z.object({
  isAuthenticated: z.boolean(),
  user: UserSchema.nullable(),
});

export type User = z.infer<typeof UserSchema>;
