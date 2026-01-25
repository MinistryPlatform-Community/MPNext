/**
 * Interface for Room_Usage_Types
* Table: Room_Usage_Types
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface RoomUsageTypes {

  Room_Usage_Type_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Room_Usage_Type: string /* max 50 chars */;

  /**
   * Max length: 255 characters
   */
  Description?: string /* max 255 chars */ | null;
}

export type RoomUsageTypesRecord = RoomUsageTypes;
