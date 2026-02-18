import { z } from 'zod';
import { MemberSchema } from '../../../lib/api/types/shared/members';

export const WorkspaceSchema = z.object({
  metadata: z.object({
    name: z.string(),
    namespace: z.string(),
    annotations: z.record(z.string(), z.string()).default({}),
  }),
  spec: z.object({
    members: z.array(MemberSchema).nullish().default([]).catch([]),
  }),
  status: z
    .object({
      namespace: z.string(),
    })
    .nullish(),
});

export type Workspace = z.infer<typeof WorkspaceSchema>;
