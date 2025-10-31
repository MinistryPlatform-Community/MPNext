import { z } from 'zod';

export const VwCcccOnlineCourseIndividualSummarySchema = z.object({
  First_User_Assignment_ID: z.number().int().nullable(),
  Display_Name: z.string().max(125).nullable(),
  Nickname: z.string().max(50).nullable(),
  Course_Title: z.string().max(255),
  Course_Status: z.string().max(50),
  First_Assignment: z.string().datetime().nullable(),
  Last_Assignment: z.string().datetime().nullable(),
  Complete_Classes: z.number().int().nullable(),
  Distinct_Classes: z.number().int().nullable(),
  Missing_Classes: z.number().int().nullable(),
  Percent_of_Classes: z.string().max(4000).nullable(),
  Course_Assignments_Completed: z.number().int().nullable(),
  Course_Assignments_Existing: z.number().int().nullable(),
  Missing_Assignments: z.number().int().nullable(),
  Percent_of_Assignments: z.string().max(4000).nullable(),
  Contact_Status: z.string().max(50),
  Participant_Type: z.string().max(50),
  Contact_ID: z.number().int(),
  User_ID: z.number().int(),
  Course_ID: z.number().int(),
});

export type VwCcccOnlineCourseIndividualSummaryInput = z.infer<typeof VwCcccOnlineCourseIndividualSummarySchema>;
