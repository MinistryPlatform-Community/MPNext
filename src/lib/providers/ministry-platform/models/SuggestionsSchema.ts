import { z } from 'zod';

export const SuggestionsSchema = z.object({
  Suggestion_ID: z.number().int(),
  Suggested_By: z.number().int(),
  Date_Suggested: z.string().datetime(),
  Suggestion_Type_ID: z.number().int(),
  Description: z.string().max(1000),
  IS_Team_Response: z.string().max(1000).nullable(),
  _Completed: z.boolean().nullable(),
});

export type SuggestionsInput = z.infer<typeof SuggestionsSchema>;
