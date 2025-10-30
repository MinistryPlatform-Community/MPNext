/**
 * Interface for dp_Account_Information
* Table: dp_Account_Information
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface DpAccountInformation {

  Account_Information_ID: number /* 32-bit integer */; // Primary Key

  Congregation_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Congregations.Congregation_ID

  Integration_Definition_Type_ID: number /* 32-bit integer */; // Foreign Key -> dp_Integration_Definition_Types.Integration_Definition_Type_ID

  API_Key?: Blob | string /* binary data */ | null;

  /**
   * Max length: 100 characters
   */
  Username?: string /* max 100 chars */ | null;

  Password?: Blob | string /* binary data */ | null;

  /**
   * Max length: 500 characters
   */
  Base_URL?: string /* max 500 chars */ | null;

  Enabled: boolean; // Has Default
}

export type DpAccountInformationRecord = DpAccountInformation;
