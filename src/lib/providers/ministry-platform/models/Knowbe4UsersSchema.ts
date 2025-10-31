import { z } from 'zod';

export const Knowbe4UsersSchema = z.object({
  KnowBe4_User_ID: z.number().int(),
  KnowBe4_ID: z.number().int(),
  Contact_ID: z.number().int(),
  KnowBe4_First_Name: z.string().max(100).nullable(),
  KnowBe4_Last_Name: z.string().max(100).nullable(),
  KnowBe4_Email_Address: z.string().max(100).nullable(),
});

export type Knowbe4UsersInput = z.infer<typeof Knowbe4UsersSchema>;
