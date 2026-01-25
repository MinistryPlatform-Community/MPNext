import { z } from 'zod';

export const VwMpResponseQualificationsSchema = z.object({
  ID: z.number().int().nullable(),
  Response_ID: z.number().int(),
  Group_Role_ID: z.number().int(),
  Participant_ID: z.number().int(),
  Attribute_Alignment: z.string().max(4000).nullable(),
  Background_Check: z.string().max(13).nullable(),
  Certification: z.string().max(13).nullable(),
  Milestone: z.string().max(10).nullable(),
  Form: z.string().max(13).nullable(),
});

export type VwMpResponseQualificationsInput = z.infer<typeof VwMpResponseQualificationsSchema>;
