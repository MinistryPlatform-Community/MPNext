import { z } from 'zod';

export const DpCommunicationTemplatesSchema = z.object({
  Communication_Template_ID: z.number().int(),
  Template_Name: z.string().max(256),
  Subject_Text: z.string().max(256),
  Body_Html: z.string().max(2147483647),
  Body_Data: z.string().max(2147483647).nullable(),
  Pertains_To_Page_ID: z.number().int().nullable(),
  Template_User: z.number().int().nullable(),
  Template_User_Group: z.number().int().nullable(),
  Active: z.boolean(),
  From_Contact: z.number().int(),
  Reply_to_Contact: z.number().int(),
  Communication_Type_ID: z.number().int(),
});

export type DpCommunicationTemplatesInput = z.infer<typeof DpCommunicationTemplatesSchema>;
