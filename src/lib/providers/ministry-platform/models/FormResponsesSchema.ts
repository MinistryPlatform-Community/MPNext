import { z } from 'zod';

export const FormResponsesSchema = z.object({
  Form_Response_ID: z.number().int(),
  Form_ID: z.number().int(),
  Response_Date: z.string().datetime(),
  IP_Address: z.string().max(45).nullable(),
  Contact_ID: z.number().int().nullable(),
  First_Name: z.string().max(50).nullable(),
  Last_Name: z.string().max(50).nullable(),
  Email_Address: z.string().email().max(254).nullable(),
  Phone_Number: z.string().max(50).nullable(),
  Address_Line_1: z.string().max(75).nullable(),
  Address_Line_2: z.string().max(75).nullable(),
  Address_City: z.string().max(50).nullable(),
  Address_State: z.string().max(50).nullable(),
  Address_Zip: z.string().max(25).nullable(),
  Event_ID: z.number().int().nullable(),
  Pledge_Campaign_ID: z.number().int().nullable(),
  Opportunity_ID: z.number().int().nullable(),
  Opportunity_Response: z.number().int().nullable(),
  Congregation_ID: z.number().int().nullable(),
  Notification_Sent: z.boolean(),
  Expires: z.string().datetime().nullable(),
  Event_Participant_ID: z.number().int().nullable(),
});

export type FormResponsesInput = z.infer<typeof FormResponsesSchema>;
