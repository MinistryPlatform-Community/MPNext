import { z } from 'zod';

export const PersonnelBeneficiariesSchema = z.object({
  Personnel_Beneficiary_ID: z.number().int(),
  Personnel_ID: z.number().int(),
  Contact_ID: z.number().int(),
  Beneficiary_Relationship_ID: z.number().int().nullable(),
  Notes: z.string().max(2000).nullable(),
});

export type PersonnelBeneficiariesInput = z.infer<typeof PersonnelBeneficiariesSchema>;
