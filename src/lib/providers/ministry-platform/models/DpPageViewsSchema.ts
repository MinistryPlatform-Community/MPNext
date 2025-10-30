import { z } from 'zod';

export const DpPageViewsSchema = z.object({
  Page_View_ID: z.number().int(),
  View_Title: z.string().max(50),
  Page_ID: z.number().int(),
  Description: z.string().max(500).nullable(),
  Field_List: z.string().max(4000).nullable(),
  View_Clause: z.string().max(4000),
  Order_By: z.string().max(255).nullable(),
  User_ID: z.number().int().nullable(),
  User_Group_ID: z.number().int().nullable(),
});

export type DpPageViewsInput = z.infer<typeof DpPageViewsSchema>;
