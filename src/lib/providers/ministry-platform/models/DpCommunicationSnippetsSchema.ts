import { z } from 'zod';

export const DpCommunicationSnippetsSchema = z.object({
  Communication_Snippet_ID: z.number().int(),
  Name: z.string().max(50),
  Value: z.string().max(2147483647),
  Pertains_To: z.number().int().nullable(),
});

export type DpCommunicationSnippetsInput = z.infer<typeof DpCommunicationSnippetsSchema>;
