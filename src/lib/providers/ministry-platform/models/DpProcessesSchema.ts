import { z } from 'zod';

export const DpProcessesSchema = z.object({
  Process_ID: z.number().int(),
  Process_Name: z.string().max(50),
  Process_Manager: z.number().int(),
  Active: z.boolean(),
  Description: z.string().max(255).nullable(),
  On_Submit: z.string().max(500).nullable(),
  On_Complete: z.string().max(500).nullable(),
  Trigger_Fields: z.string().max(255).nullable(),
  Dependent_Condition: z.string().max(4000).nullable(),
  Trigger_On_Create: z.boolean(),
  Trigger_On_Update: z.boolean(),
  Table_Name: z.unknown(),
});

export type DpProcessesInput = z.infer<typeof DpProcessesSchema>;
