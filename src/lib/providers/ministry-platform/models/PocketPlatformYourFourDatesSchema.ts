import { z } from 'zod';

export const PocketPlatformYourFourDatesSchema = z.object({
  Your_Four_Date_ID: z.number().int(),
  Reminder_Text: z.string().max(50).nullable(),
  Date: z.string().datetime(),
  Day: z.unknown(),
  DaySuffix: z.string().max(2),
  Weekday: z.unknown(),
  WeekDayName: z.string().max(10),
  IsWeekend: z.boolean(),
  DOWInMonth: z.unknown(),
  DayOfYear: z.number().int(),
  WeekOfMonth: z.unknown(),
  WeekOfYear: z.unknown(),
  Month: z.unknown(),
  MonthName: z.string().max(10),
  Year: z.number().int(),
  MMYYYY: z.string().max(6),
  MonthYear: z.string().max(7),
});

export type PocketPlatformYourFourDatesInput = z.infer<typeof PocketPlatformYourFourDatesSchema>;
