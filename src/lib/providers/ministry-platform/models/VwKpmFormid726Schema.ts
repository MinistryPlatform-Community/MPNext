import { z } from 'zod';

export const VwKpmFormid726Schema = z.object({
  Read_Only_PK: z.number().int(),
  Form_Response_ID: z.number().int(),
  Event_Participant_ID: z.number().int(),
  "Agreement 1": z.string().max(254).nullable(),
  "Digital Signature 1": z.string().max(254).nullable(),
  "Relationship to minor": z.string().max(254).nullable(),
  "Agreement 2": z.string().max(254).nullable(),
  "Digital Signature 2": z.string().max(254).nullable(),
});

export type VwKpmFormid726Input = z.infer<typeof VwKpmFormid726Schema>;
