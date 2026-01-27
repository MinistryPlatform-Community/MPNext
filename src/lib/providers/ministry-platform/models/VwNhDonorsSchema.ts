import { z } from 'zod';

export const VwNhDonorsSchema = z.object({
  Donor_ID: z.number().int().nullable(),
  Display_Name: z.string().max(125),
  Nickname: z.string().max(50).nullable(),
  Prefix: z.string().max(50).nullable(),
  Contact_Status: z.string().max(50),
  Date_of_Birth: z.string().datetime().nullable(),
  Age: z.unknown().nullable(),
  Home_Phone: z.string().nullable(),
  Mobile_Phone: z.string().nullable(),
  Email_Address: z.string().email().max(254).nullable(),
  Bulk_Mail_Opt_Out: z.boolean(),
  Current_Mail_Address_Line_1: z.string().max(75).nullable(),
  Current_Mail_Address_Line_2: z.string().max(75).nullable(),
  Current_Mail_City: z.string().max(50).nullable(),
  Current_Mail_State: z.string().max(50).nullable(),
  Current_Mail_Postal_Code: z.string().max(15).nullable(),
  Current_Mail_Foreign_Country: z.string().max(255).nullable(),
  Major_Donor: z.boolean().nullable(),
  Recurring_Donor: z.boolean().nullable(),
  First_Donation: z.string().datetime().nullable(),
  Last_Donation: z.string().datetime().nullable(),
  Donation_Count: z.number().int().nullable(),
  Donations_This_Year: z.number().int().nullable(),
  Donations_Last_Year: z.number().int().nullable(),
  Contact_ID: z.number().int(),
  Congregation_ID: z.number().int().nullable(),
});

export type VwNhDonorsInput = z.infer<typeof VwNhDonorsSchema>;
