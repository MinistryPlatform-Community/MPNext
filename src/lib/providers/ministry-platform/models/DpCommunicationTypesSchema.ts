import { z } from 'zod';

export const DpCommunicationTypesSchema = z.object({
  Communication_Type_ID: z.number().int(),
  Communication_Type: z.string().max(25),
});

export type DpCommunicationTypesInput = z.infer<typeof DpCommunicationTypesSchema>;
