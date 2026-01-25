import { z } from 'zod';

export const ProgramGroupsSchema = z.object({
  Program_Group_ID: z.number().int(),
  Program_ID: z.number().int(),
  Group_ID: z.number().int(),
  Room_ID: z.number().int().nullable(),
  Start_Date: z.string().datetime(),
  End_Date: z.string().datetime().nullable(),
});

export type ProgramGroupsInput = z.infer<typeof ProgramGroupsSchema>;
