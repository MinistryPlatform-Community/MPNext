import { z } from 'zod';

export const ShipmentItemsSchema = z.object({
  Shipment_Item_ID: z.number().int(),
  Shipment_ID: z.number().int(),
  Item_Description: z.string().max(100),
  Product_Option_Price_ID: z.number().int().nullable(),
  Item_Sort: z.number().int(),
  Item_Qty: z.number().int(),
  Qty_Is_Per_Box: z.boolean(),
});

export type ShipmentItemsInput = z.infer<typeof ShipmentItemsSchema>;
