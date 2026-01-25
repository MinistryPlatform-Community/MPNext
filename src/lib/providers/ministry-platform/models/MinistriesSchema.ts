import { z } from 'zod';

export const MinistriesSchema = z.object({
  Ministry_ID: z.number().int(),
  Ministry_Name: z.string().max(50),
  Nickname: z.string().max(50).nullable(),
  Description: z.string().max(255).nullable(),
  Start_Date: z.string().datetime(),
  End_Date: z.string().datetime().nullable(),
  Primary_Contact: z.number().int(),
  Parent_Ministry: z.number().int().nullable(),
  Available_Online: z.boolean(),
  Priority_ID: z.number().int().nullable(),
  Leadership_Team: z.number().int().nullable(),
});

export type MinistriesInput = z.infer<typeof MinistriesSchema>;
