/**
 * Interface for Journeys
* Table: Journeys
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface Journeys {

  Journey_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Journey_Name: string /* max 50 chars */;

  /**
   * Max length: 255 characters
   */
  Description?: string /* max 255 chars */ | null;

  Leadership_Team?: number /* 32-bit integer */ | null; // Foreign Key -> Groups.Group_ID

  Gamify?: boolean | null;

  Active?: boolean | null;

  /**
   * Max length: 400 characters
   */
  Badge?: string /* max 400 chars */ | null;

  Start_Date?: string /* ISO datetime */ | null;

  End_Date?: string /* ISO datetime */ | null;

  /**
   * Max length: 150 characters
   */
  Finish_Message?: string /* max 150 chars */ | null;
}

export type JourneysRecord = Journeys;
