/**
 * Interface for Pocket_Platform_Sermons
* Table: Pocket_Platform_Sermons
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface PocketPlatformSermons {

  Sermon_ID: number /* 32-bit integer */; // Primary Key

  Series_ID: number /* 32-bit integer */; // Foreign Key -> Pocket_Platform_Sermon_Series.Sermon_Series_ID

  Congregation_ID: number /* 32-bit integer */; // Foreign Key -> Congregations.Congregation_ID

  Service_Type_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Pocket_Platform_Service_Types.Service_Type_ID

  /**
   * Max length: 100 characters
   */
  Title: string /* max 100 chars */;

  /**
   * Max length: 100 characters
   */
  Subtitle?: string /* max 100 chars */ | null;

  /**
   * Max length: 2147483647 characters
   */
  Description?: string /* max 2147483647 chars */ | null;

  Sermon_Date: string /* ISO datetime */;

  Speaker_ID: number /* 32-bit integer */; // Foreign Key -> Pocket_Platform_Speakers.Speaker_ID

  /**
   * Max length: 255 characters
   */
  Scripture_Links?: string /* max 255 chars */ | null;

  Position?: number /* 32-bit integer */ | null;

  Use_For_Podcast?: boolean | null;

  Status_ID: number /* 32-bit integer */; // Foreign Key -> Pocket_Platform_Statuses.Status_ID

  Notes_Form_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Forms.Form_ID

  Sermon_UUID?: string /* GUID/UUID */ | null; // Has Default

  Web_Post_ID?: number /* 32-bit integer */ | null;

  Processing_Complete: boolean; // Has Default

  Book_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Pocket_Platform_Bible_Books.Book_ID
}

export type PocketPlatformSermonsRecord = PocketPlatformSermons;
