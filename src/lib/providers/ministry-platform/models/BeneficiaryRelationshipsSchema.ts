import { z } from 'zod';

export const BeneficiaryRelationshipsSchema = z.object({
  Beneficiary_Relationship_ID: z.number().int(),
  Beneficiary_Relationship: z.string().max(75),
});

export type BeneficiaryRelationshipsInput = z.infer<typeof BeneficiaryRelationshipsSchema>;
