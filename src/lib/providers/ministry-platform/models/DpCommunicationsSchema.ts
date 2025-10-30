import { z } from 'zod';

export const DpCommunicationsSchema = z.object({
  Communication_ID: z.number().int(),
  Author_User_ID: z.number().int(),
  Communication_Type_ID: z.number().int(),
  Communication_Status_ID: z.number().int().nullable(),
  Selection_ID: z.number().int().nullable(),
  Send_To_Parents: z.boolean(),
  Subject: z.string().max(1000),
  Body: z.string().max(2147483647),
  Pertains_To_Page_ID: z.number().int().nullable(),
  _Sent_From_Task: z.number().int().nullable(),
  To_Contact: z.number().int().nullable(),
  From_SMS_Number: z.number().int().nullable(),
  From_Contact: z.number().int(),
  Reply_to_Contact: z.number().int(),
  Start_Date: z.string().datetime(),
  Time_Zone: z.unknown().nullable(),
  Locale: z.unknown().nullable(),
  Bulk_Email: z.boolean(),
  Template: z.boolean(),
  Active: z.boolean(),
  Expire_Date: z.string().datetime().nullable(),
  Template_User: z.number().int().nullable(),
  Template_User_Group: z.number().int().nullable(),
  Communication_GUID: z.string().uuid(),
  Alternate_Email_Type_ID: z.number().int().nullable(),
  Publication_ID: z.number().int().nullable(),
});

export type DpCommunicationsInput = z.infer<typeof DpCommunicationsSchema>;
