/**
 * Interface for Pocket_Platform_Sermon_Series
* Table: Pocket_Platform_Sermon_Series
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface PocketPlatformSermonSeries {

  Sermon_Series_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 100 characters
   */
  Title: string /* max 100 chars */;

  /**
   * Max length: 100 characters
   */
  Display_Title?: string /* max 100 chars */ | null;

  /**
   * Max length: 100 characters
   */
  Subtitle?: string /* max 100 chars */ | null;

  Status_ID: number /* 32-bit integer */; // Foreign Key -> Pocket_Platform_Statuses.Status_ID

  Position?: number /* 32-bit integer */ | null;

  Series_UUID?: string /* GUID/UUID */ | null; // Has Default

  Last_Message_Date?: string /* ISO datetime */ | null;

  Series_Start_Date?: string /* ISO datetime */ | null;

  Enable_On_OTT?: boolean | null; // Has Default

  /**
   * Max length: 2147483647 characters
   */
  Description?: string /* max 2147483647 chars */ | null;

  Web_Term_ID?: number /* 32-bit integer */ | null;

  Sermon_Series_Type_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Pocket_Platform_Sermon_Series_Types.Sermon_Series_Type_ID

  Congregation_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Congregations.Congregation_ID

  Book_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Pocket_Platform_Bible_Books.Book_ID

  Latest_Sermon_Date?: string /* ISO datetime */ | null;

  /**
   * Max length: 255 characters
   */
  Banner_Image_URL?: string /* max 255 chars */ | null;
}

export type PocketPlatformSermonSeriesRecord = PocketPlatformSermonSeries;
