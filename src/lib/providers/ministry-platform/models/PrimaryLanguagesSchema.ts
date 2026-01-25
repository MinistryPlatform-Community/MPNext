import { z } from 'zod';

export const PrimaryLanguagesSchema = z.object({
  Primary_Language_ID: z.number().int(),
  Primary_Language: z.string().max(50),
});

export type PrimaryLanguagesInput = z.infer<typeof PrimaryLanguagesSchema>;
