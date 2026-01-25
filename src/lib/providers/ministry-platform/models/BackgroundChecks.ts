/**
 * Interface for Background_Checks
* Table: Background_Checks
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface BackgroundChecks {

  Background_Check_ID: number /* 32-bit integer */; // Primary Key

  Contact_ID: number /* 32-bit integer */; // Foreign Key -> Contacts.Contact_ID

  Requesting_Ministry?: number /* 32-bit integer */ | null; // Foreign Key -> Ministries.Ministry_ID

  Background_Check_Submitted?: string /* ISO datetime */ | null;

  Background_Check_Returned?: string /* ISO datetime */ | null;

  All_Clear?: boolean | null;

  /**
   * Max length: 500 characters
   */
  Notes?: string /* max 500 chars */ | null;

  Theft?: boolean | null;

  Drugs?: boolean | null;

  Sexual?: boolean | null;

  DUI?: boolean | null;

  Battery?: boolean | null;

  Traffic?: boolean | null;

  Other?: boolean | null;

  Background_Check_Started: string /* ISO datetime */; // Has Default

  /**
   * Max length: 50 characters
   */
  Reference_Number?: string /* max 50 chars */ | null;

  Report_Url?: string /* URL */ | null;

  Background_Check_Type_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Background_Check_Types.Background_Check_Type_ID

  Background_Check_GUID: string /* GUID/UUID */; // Has Default

  /**
   * Max length: 50 characters
   */
  First_Name?: string /* max 50 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Middle_Name?: string /* max 50 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Last_Name?: string /* max 50 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Maiden_Name?: string /* max 50 chars */ | null;

  Date_Of_Birth?: string /* ISO date (YYYY-MM-DD) */ | null;

  /**
   * Max length: 50 characters
   */
  Gender?: string /* max 50 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Race?: string /* max 50 chars */ | null;

  /**
   * Max length: 128 characters
   */
  Address_Line_1?: string /* max 128 chars */ | null;

  /**
   * Max length: 50 characters
   */
  City?: string /* max 50 chars */ | null;

  /**
   * Max length: 50 characters
   */
  State?: string /* max 50 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Postal_Code?: string /* max 50 chars */ | null;

  /**
   * Max length: 128 characters
   */
  Digital_Signature?: string /* max 128 chars */ | null;

  /**
   * Max length: 50 characters
   */
  DL_Number?: string /* max 50 chars */ | null;

  /**
   * Max length: 128 characters
   */
  Jurisdiction?: string /* max 128 chars */ | null;

  /**
   * Max length: 50 characters
   */
  DL_State?: string /* max 50 chars */ | null;

  Background_Check_Expires?: string /* ISO datetime */ | null;

  Background_Check_Status_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Background_Check_Statuses.Background_Check_Status_ID

  Status_Date?: string /* ISO datetime */ | null;

  /**
   * Max length: 45 characters
   */
  IP_Address?: string /* max 45 chars */ | null;
}

export type BackgroundChecksRecord = BackgroundChecks;
