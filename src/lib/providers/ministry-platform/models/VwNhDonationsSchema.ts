import { z } from 'zod';

export const VwNhDonationsSchema = z.object({
  Donation_Distribution_ID: z.number().int(),
  Display_Name: z.string().max(125),
  Donation_Date: z.string().datetime(),
  Amount: z.number(),
  Program_Name: z.string().max(130),
  Is_Soft_Credit: z.string().max(5),
  Item_Number: z.string().max(15).nullable(),
  Major_Donor: z.boolean().nullable(),
  Recurring_Donor: z.boolean().nullable(),
  Nickname: z.string().max(50).nullable(),
  Prefix: z.string().max(50).nullable(),
  Contact_Status: z.string().max(50).nullable(),
  Date_of_Birth: z.string().datetime().nullable(),
  Age: z.unknown().nullable(),
  Home_Phone: z.string().nullable(),
  Mobile_Phone: z.string().nullable(),
  Email_Address: z.string().email().max(254).nullable(),
  Bulk_Mail_Opt_Out: z.boolean().nullable(),
  Current_Mail_Address_Line_1: z.string().max(75).nullable(),
  Current_Mail_Address_Line_2: z.string().max(75).nullable(),
  Current_Mail_City: z.string().max(50).nullable(),
  Current_Mail_State: z.string().max(50).nullable(),
  Current_Mail_Postal_Code: z.string().max(15).nullable(),
  Current_Mail_Foreign_Country: z.string().max(255).nullable(),
  Contact_ID: z.number().int().nullable(),
  Donor_ID: z.number().int(),
  Program_ID: z.number().int(),
  Congregation_ID: z.number().int(),
});

export type VwNhDonationsInput = z.infer<typeof VwNhDonationsSchema>;
