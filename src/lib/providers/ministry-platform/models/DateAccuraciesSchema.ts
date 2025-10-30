import { z } from 'zod';

export const DateAccuraciesSchema = z.object({
  Date_Accuracy_ID: z.number().int(),
  Date_Accuracy: z.string().max(50),
});

export type DateAccuraciesInput = z.infer<typeof DateAccuraciesSchema>;
