/**
 * Interface for Need_Type_Providers
* Table: Need_Type_Providers
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport
 * Generated from column metadata
 */
export interface NeedTypeProviders {

  Need_Type_Provider_ID: number /* 32-bit integer */; // Primary Key

  Need_Type_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Need_Types.Need_Type_ID

  /**
   * Max length: 255 characters
   */
  Other_Need?: string /* max 255 chars */ | null;

  Need_Provider_ID: number /* 32-bit integer */; // Foreign Key -> Need_Providers.Need_Provider_ID

  Approved?: boolean | null;
}

export type NeedTypeProvidersRecord = NeedTypeProviders;
