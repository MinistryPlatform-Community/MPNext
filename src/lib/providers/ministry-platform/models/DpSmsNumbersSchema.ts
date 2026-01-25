import { z } from 'zod';

export const DpSmsNumbersSchema = z.object({
  SMS_Number_ID: z.number().int(),
  Number_Title: z.string().max(50),
  SMS_Number: z.string().nullable(),
  Active: z.boolean(),
  Default: z.boolean(),
  User_Group_ID: z.number().int().nullable(),
  Congregation_ID: z.number().int().nullable(),
  Cost_Per_Segment: z.number().nullable(),
  Texting_Compliance_Level: z.number().int(),
  Sender_Label: z.string().max(50).nullable(),
});

export type DpSmsNumbersInput = z.infer<typeof DpSmsNumbersSchema>;
