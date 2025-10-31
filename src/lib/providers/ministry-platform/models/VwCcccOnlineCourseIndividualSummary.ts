/**
 * Interface for vw_cccc_online_course_individual_summary
* Table: vw_cccc_online_course_individual_summary
 * Access Level: Read
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface VwCcccOnlineCourseIndividualSummary {

  First_User_Assignment_ID?: number /* 32-bit integer */ | null; // Primary Key

  /**
   * Max length: 125 characters
   */
  Display_Name?: string /* max 125 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Nickname?: string /* max 50 chars */ | null;

  /**
   * Max length: 255 characters
   */
  Course_Title: string /* max 255 chars */;

  /**
   * Max length: 50 characters
   */
  Course_Status: string /* max 50 chars */;

  First_Assignment?: string /* ISO datetime */ | null;

  Last_Assignment?: string /* ISO datetime */ | null;

  Complete_Classes?: number /* 32-bit integer */ | null;

  Distinct_Classes?: number /* 32-bit integer */ | null;

  Missing_Classes?: number /* 32-bit integer */ | null;

  /**
   * Max length: 4000 characters
   */
  Percent_of_Classes?: string /* max 4000 chars */ | null;

  Course_Assignments_Completed?: number /* 32-bit integer */ | null;

  Course_Assignments_Existing?: number /* 32-bit integer */ | null;

  Missing_Assignments?: number /* 32-bit integer */ | null;

  /**
   * Max length: 4000 characters
   */
  Percent_of_Assignments?: string /* max 4000 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Contact_Status: string /* max 50 chars */;

  /**
   * Max length: 50 characters
   */
  Participant_Type: string /* max 50 chars */;

  Contact_ID: number /* 32-bit integer */;

  User_ID: number /* 32-bit integer */;

  Course_ID: number /* 32-bit integer */;
}

export type VwCcccOnlineCourseIndividualSummaryRecord = VwCcccOnlineCourseIndividualSummary;
