import { z } from 'zod';

export const DpPageViewRulesSchema = z.object({
  Rule_ID: z.number().int(),
  Page_View_ID: z.number().int(),
  Field_Name: z.string().max(64),
  Condition: z.string().max(800).nullable(),
  Text_Color: z.unknown().nullable(),
  Background_Color: z.unknown().nullable(),
  Image_Name: z.string().max(32).nullable(),
  Show_Percentage: z.boolean(),
  Show_Label: z.boolean(),
  Format_As: z.number().int().nullable(),
});

export type DpPageViewRulesInput = z.infer<typeof DpPageViewRulesSchema>;
