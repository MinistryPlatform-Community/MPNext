import { z } from 'zod';

export const BpClassAssignmentsSchema = z.object({
  Assignment_ID: z.number().int(),
  Class_ID: z.number().int(),
  Title: z.string().max(100).nullable(),
  Subtitle: z.string().max(100).nullable(),
  Link_URL: z.string().max(150).nullable(),
  Display_Order: z.number().int().nullable(),
  Required_To_Complete_Class: z.boolean(),
});

export type BpClassAssignmentsInput = z.infer<typeof BpClassAssignmentsSchema>;
