/**
 * Interface for dp_Identity_Providers
* Table: dp_Identity_Providers
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport
 * Generated from column metadata
 */
export interface DpIdentityProviders {

  Identity_Provider_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Display_Name: string /* max 50 chars */;

  Identity_Provider_Type_ID: number /* 32-bit integer */; // Foreign Key -> dp_Identity_Provider_Types.Identity_Provider_Type_ID

  /**
   * Max length: 128 characters
   */
  Client_ID: string /* max 128 chars */;

  Client_Secret?: Blob | string /* binary data */ | null;

  /**
   * Max length: 128 characters
   */
  Metadata_Address?: string /* max 128 chars */ | null;

  Is_Public: boolean; // Has Default

  Identity_Provider_Unique_ID: string /* GUID/UUID */; // Has Default

  /**
   * Max length: 4000 characters
   */
  Settings?: string /* max 4000 chars */ | null;
}

export type DpIdentityProvidersRecord = DpIdentityProviders;
