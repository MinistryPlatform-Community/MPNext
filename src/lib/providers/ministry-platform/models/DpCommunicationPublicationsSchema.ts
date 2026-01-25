import { z } from 'zod';

export const DpCommunicationPublicationsSchema = z.object({
  Communication_Publication_ID: z.number().int(),
  Communication_ID: z.number().int(),
  Publication_ID: z.number().int(),
});

export type DpCommunicationPublicationsInput = z.infer<typeof DpCommunicationPublicationsSchema>;
