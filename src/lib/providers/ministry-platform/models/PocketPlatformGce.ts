/**
 * Interface for Pocket_Platform_GCE
* Table: Pocket_Platform_GCE
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface PocketPlatformGce {

  GCE_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 100 characters
   */
  Title: string /* max 100 chars */;

  /**
   * Max length: 2147483647 characters
   */
  Content: string /* max 2147483647 chars */;

  Show_Header: boolean; // Has Default

  /**
   * Max length: 1000 characters
   */
  Imported_ID?: string /* max 1000 chars */ | null;

  Congregation_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Congregations.Congregation_ID
}

export type PocketPlatformGceRecord = PocketPlatformGce;
