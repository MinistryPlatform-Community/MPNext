import { z } from 'zod';

export const PrintServersSchema = z.object({
  Print_Server_ID: z.number().int(),
  Machine_Name: z.string().max(128),
  Description: z.string().max(255).nullable(),
});

export type PrintServersInput = z.infer<typeof PrintServersSchema>;
