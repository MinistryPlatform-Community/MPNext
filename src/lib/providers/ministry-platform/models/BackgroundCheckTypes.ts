/**
 * Interface for Background_Check_Types
* Table: Background_Check_Types
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface BackgroundCheckTypes {

  Background_Check_Type_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 128 characters
   */
  Background_Check_Type: string /* max 128 chars */;

  /**
   * Max length: 256 characters
   */
  Description?: string /* max 256 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Service_Code?: string /* max 50 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Package_Service_Code?: string /* max 50 chars */ | null;

  Collect_DL: boolean; // Has Default

  /**
   * Max length: 50 characters
   */
  Service_Code_Delayed?: string /* max 50 chars */ | null;

  Collect_State: boolean; // Has Default

  Collect_Jurisdiction: boolean; // Has Default

  Collect_Ethnicity: boolean; // Has Default

  Default_Package: boolean; // Has Default

  Detect_County: boolean; // Has Default

  Drug_Test: boolean; // Has Default

  Is_Background_Check: boolean; // Has Default

  Credit_Check: boolean; // Has Default

  Months_Till_Expires?: number /* 32-bit integer */ | null;

  Expiring_Soon_Days?: number /* 32-bit integer */ | null;

  Type_Needs_Review: boolean; // Has Default

  Enabled: boolean; // Has Default
}

export type BackgroundCheckTypesRecord = BackgroundCheckTypes;
