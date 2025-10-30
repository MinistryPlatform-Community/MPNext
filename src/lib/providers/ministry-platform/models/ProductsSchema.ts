import { z } from 'zod';

export const ProductsSchema = z.object({
  Product_ID: z.number().int(),
  Product_Name: z.string().max(50),
  Congregation_ID: z.number().int().nullable(),
  Description: z.string().max(2147483647).nullable(),
  Base_Price: z.number(),
  Deposit_Price: z.number().nullable(),
  Active: z.boolean(),
  Price_Currency: z.number().int().nullable(),
});

export type ProductsInput = z.infer<typeof ProductsSchema>;
