import { z } from 'zod';

export const ProductOptionPricesSchema = z.object({
  Product_Option_Price_ID: z.number().int(),
  Product_Option_Group_ID: z.number().int(),
  Option_Price: z.number(),
  Option_Title: z.string().max(50),
  Active: z.boolean(),
  Qty_Allowed: z.number().int(),
  Add_to_Group: z.number().int().nullable(),
  Sort_Order: z.number().int().nullable(),
  Max_Qty: z.number().int().nullable(),
  Days_Out_To_Hide: z.number().int().nullable(),
  Promo_Code: z.string().max(20).nullable(),
  Min_Qty: z.number().int().nullable(),
  Attending_Online: z.boolean(),
});

export type ProductOptionPricesInput = z.infer<typeof ProductOptionPricesSchema>;
