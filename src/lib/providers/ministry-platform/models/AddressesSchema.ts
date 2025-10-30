import { z } from 'zod';

export const AddressesSchema = z.object({
  Address_ID: z.number().int(),
  Address_Line_1: z.string().max(75),
  Address_Line_2: z.string().max(75).nullable(),
  City: z.string().max(50).nullable(),
  "State/Region": z.string().max(50).nullable(),
  Postal_Code: z.string().max(15).nullable(),
  Foreign_Country: z.string().max(255).nullable(),
  Country_Code: z.string().max(25).nullable(),
  Carrier_Route: z.string().max(10).nullable(),
  Lot_Number: z.string().max(10).nullable(),
  Delivery_Point_Code: z.string().max(3).nullable(),
  Delivery_Point_Check_Digit: z.unknown().nullable(),
  Latitude: z.string().max(15).nullable(),
  Longitude: z.string().max(15).nullable(),
  Altitude: z.string().max(15).nullable(),
  Time_Zone: z.string().max(50).nullable(),
  Bar_Code: z.string().max(50).nullable(),
  Area_Code: z.string().max(50).nullable(),
  Last_Validation_Attempt: z.string().datetime().nullable(),
  County: z.string().max(50).nullable(),
  Validated: z.boolean().nullable(),
  Do_Not_Validate: z.boolean(),
  Last_GeoCode_Attempt: z.string().datetime().nullable(),
  Country: z.string().max(100).nullable(),
});

export type AddressesInput = z.infer<typeof AddressesSchema>;
