import { z } from 'zod';

export const SuggestionTypesSchema = z.object({
  Suggestion_Type_ID: z.number().int(),
  Suggestion_Type: z.string().max(50),
  Description: z.string().max(255).nullable(),
});

export type SuggestionTypesInput = z.infer<typeof SuggestionTypesSchema>;
