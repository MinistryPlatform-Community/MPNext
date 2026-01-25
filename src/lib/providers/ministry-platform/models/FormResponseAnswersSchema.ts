import { z } from 'zod';

export const FormResponseAnswersSchema = z.object({
  Form_Response_Answer_ID: z.number().int(),
  Form_Field_ID: z.number().int(),
  Response: z.string().max(2147483647).nullable(),
  Form_Response_ID: z.number().int(),
  Event_Participant_ID: z.number().int().nullable(),
  Pledge_ID: z.number().int().nullable(),
  Opportunity_Response: z.number().int().nullable(),
  Placed: z.boolean().nullable(),
});

export type FormResponseAnswersInput = z.infer<typeof FormResponseAnswersSchema>;
