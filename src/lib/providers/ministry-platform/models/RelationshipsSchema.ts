import { z } from 'zod';

export const RelationshipsSchema = z.object({
  Relationship_ID: z.number().int(),
  Relationship_Name: z.string().max(50),
  Description: z.string().max(255).nullable(),
  Male_Label: z.string().max(50).nullable(),
  Female_Label: z.string().max(50).nullable(),
  Reciprocal_Relationship_ID: z.number().int().nullable(),
});

export type RelationshipsInput = z.infer<typeof RelationshipsSchema>;
