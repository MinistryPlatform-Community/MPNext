import { z } from 'zod';

export const DpSubPageViewsSchema = z.object({
  Sub_Page_View_ID: z.number().int(),
  View_Title: z.string().max(50),
  Sub_Page_ID: z.number().int(),
  Description: z.string().max(500).nullable(),
  Field_List: z.string().max(4000).nullable(),
  View_Clause: z.string().max(4000),
  Order_By: z.string().max(255).nullable(),
  User_ID: z.number().int().nullable(),
  Messaging_View: z.boolean(),
});

export type DpSubPageViewsInput = z.infer<typeof DpSubPageViewsSchema>;
