import { z } from 'zod';

export const resolveConflictSchema = z.object({
  status: z.enum(['UNDER_REVIEW', 'RESOLVED', 'REJECTED'], {
    errorMap: () => ({ message: 'Status must be UNDER_REVIEW, RESOLVED, or REJECTED' }),
  }),
  resolutionNote: z
    .string()
    .min(10, 'Resolution note must be at least 10 characters')
    .max(2000, 'Resolution note must not exceed 2000 characters'),
});

export type ResolveConflictPayload = z.infer<typeof resolveConflictSchema>;
