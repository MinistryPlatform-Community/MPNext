/**
 * Interface for Church_Online_Watch_Types
* Table: Church_Online_Watch_Types
 * Access Level: ReadWrite
 * Special Permissions: None
 * Generated from column metadata
 */
export interface ChurchOnlineWatchTypes {

  Church_Online_Watch_Type_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Watch_Type: string /* max 50 chars */;

  /**
   * Max length: 150 characters
   */
  Description?: string /* max 150 chars */ | null;
}

export type ChurchOnlineWatchTypesRecord = ChurchOnlineWatchTypes;
