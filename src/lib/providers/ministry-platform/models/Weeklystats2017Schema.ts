import { z } from 'zod';

export const Weeklystats2017Schema = z.object({
  "Event Start Date": z.string().datetime().nullable(),
  "Event Title": z.string().max(255).nullable(),
  Congregation: z.string().max(255).nullable(),
  HeadCount: z.number().nullable(),
  Congregation_ID: z.number().int().nullable(),
  Event_ID: z.number().int().nullable(),
});

export type Weeklystats2017Input = z.infer<typeof Weeklystats2017Schema>;
