import { z } from 'zod';
import { MemberSchema } from '../../../lib/api/types/shared/members';

const AnnotationsSchema = z.preprocess((value) => {
  if (!value || typeof value !== 'object') {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, val]) => [key, val == null ? '' : String(val)]),
  );
}, z.record(z.string(), z.string()).default({}));

const MembersSchema = z.preprocess(
  (value) => (Array.isArray(value) ? value.filter(Boolean) : []),
  z.array(MemberSchema),
);

const StatusSchema = z.preprocess(
  (value) => {
    if (!value || typeof value !== 'object') {
      return undefined;
    }

    const record = value as Record<string, unknown>;
    if (record.namespace == null) {
      return undefined;
    }

    return { namespace: record.namespace };
  },
  z
    .object({
      namespace: z.string(),
    })
    .optional(),
);

export const WorkspaceSchema = z.object({
  metadata: z.object({
    name: z.string(),
    namespace: z.string(),
    annotations: AnnotationsSchema,
  }),
  spec: z.object({
    members: MembersSchema,
  }),
  status: StatusSchema,
});

export type Workspace = z.infer<typeof WorkspaceSchema>;
