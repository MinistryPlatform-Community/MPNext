import { z } from 'zod';

export const AcsRelationshipMappingSchema = z.object({
  ACS_Relationship_ID: z.number().int(),
  ACS_Relationship_Label: z.string().max(50),
  Relationship_ID: z.number().int().nullable(),
  Recip_Relationship_ID: z.number().int().nullable(),
});

export type AcsRelationshipMappingInput = z.infer<typeof AcsRelationshipMappingSchema>;
