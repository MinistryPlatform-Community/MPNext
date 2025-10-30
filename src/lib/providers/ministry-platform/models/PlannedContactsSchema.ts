import { z } from 'zod';

export const PlannedContactsSchema = z.object({
  Planned_Contact_ID: z.number().int(),
  Planned_Contact_Title: z.string().max(50),
  Instructions: z.string().max(500).nullable(),
  Manager: z.number().int(),
  Hours_Until_Past_Due: z.number().int(),
  Maximum_Attempts: z.number().int(),
  Notify_On_Max_Attempts: z.boolean(),
  Notify_On_Failure: z.boolean(),
  Next_Planned_Contact: z.number().int().nullable(),
  Next_Contact_By: z.number().int().nullable(),
  Days_Until_Next_Contact: z.number().int().nullable(),
  Call_Team: z.number().int().nullable(),
});

export type PlannedContactsInput = z.infer<typeof PlannedContactsSchema>;
