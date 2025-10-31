import { z } from 'zod';

export const SurgechurchesSchema = z.object({
  Program: z.string().max(255).nullable(),
  "Church Plant Pastor": z.string().max(255).nullable(),
  "Church Plant Date": z.string().datetime().nullable(),
  "Church Plant Donation Amount": z.number().nullable(),
  "City or Village": z.string().max(255).nullable(),
  Country: z.string().max(255).nullable(),
  Continent: z.string().max(255).nullable(),
  "Check Sent to Surge": z.number().nullable(),
  "Certificate Received from Surge": z.number().nullable(),
  "Certificate Sent to Donor": z.number().nullable(),
  "Placard Number": z.number().nullable(),
});

export type SurgechurchesInput = z.infer<typeof SurgechurchesSchema>;
