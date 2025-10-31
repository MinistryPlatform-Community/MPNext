/**
 * Interface for import_Sermons
* Table: import_Sermons
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface ImportSermons {

  /**
   * Max length: 200 characters
   */
  Title?: string /* max 200 chars */ | null;

  /**
   * Max length: 1200 characters
   */
  Description?: string /* max 1200 chars */ | null;

  Sermon_Date?: string /* ISO datetime */ | null;

  WP_Post_ID: number /* 32-bit integer */; // Primary Key

  WP_Category_ID?: number /* 32-bit integer */ | null;

  Speaker_ID?: number /* 32-bit integer */ | null;

  /**
   * Max length: 200 characters
   */
  Video_URL?: string /* max 200 chars */ | null;

  /**
   * Max length: 200 characters
   */
  Audio_URL?: string /* max 200 chars */ | null;

  /**
   * Max length: 200 characters
   */
  Info_URL?: string /* max 200 chars */ | null;

  Sermon_ID?: number /* 32-bit integer */ | null;
}

export type ImportSermonsRecord = ImportSermons;
