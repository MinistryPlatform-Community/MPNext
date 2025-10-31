import { z } from 'zod';

export const ItHelpTicketsSchema = z.object({
  IT_Help_Ticket_ID: z.number().int(),
  Submitted_For: z.number().int(),
  Request_Date: z.string().datetime(),
  Due_Date: z.string().datetime().nullable(),
  Request_Title: z.string().max(254),
  Severity: z.string().max(50).nullable(),
  System: z.string().max(50).nullable(),
  Assigned_User: z.number().int().nullable(),
  Description: z.string().max(4000).nullable(),
  Url: z.string().url().nullable(),
  File1: z.string().url().nullable(),
  File2: z.string().url().nullable(),
  File3: z.string().url().nullable(),
  File4: z.string().url().nullable(),
  Resolution_Notes: z.string().max(4000).nullable(),
  Completed: z.boolean().nullable(),
  Enable_Conversation: z.boolean(),
  Conversation_Url: z.string().url().nullable(),
});

export type ItHelpTicketsInput = z.infer<typeof ItHelpTicketsSchema>;
