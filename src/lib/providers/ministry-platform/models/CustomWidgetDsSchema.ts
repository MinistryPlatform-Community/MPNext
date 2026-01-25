import { z } from 'zod';

export const CustomWidgetDsSchema = z.object({
  Custom_Widget_DS_ID: z.number().int(),
  Name: z.string().max(50),
  Table: z.unknown(),
  Select: z.string().max(2000).nullable(),
  Filter: z.string().max(2000),
  OrderBy: z.string().max(256).nullable(),
  GroupBy: z.string().max(256).nullable(),
  Top: z.number().int().nullable(),
  Auth_Required: z.boolean(),
});

export type CustomWidgetDsInput = z.infer<typeof CustomWidgetDsSchema>;
