import { z } from 'zod';

export const MobileappMenuItemsSchema = z.object({
  MobileApp_Menu_Item_ID: z.number().int(),
  Menu_Item: z.string().max(50),
  Icon: z.string().max(50).nullable(),
  Launch_URL: z.string().max(512),
  Send_Authentication: z.boolean(),
  Sort_Order: z.number().int(),
  Role_ID: z.number().int().nullable(),
});

export type MobileappMenuItemsInput = z.infer<typeof MobileappMenuItemsSchema>;
