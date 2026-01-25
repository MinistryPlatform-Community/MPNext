/**
 * Interface for Needs
* Table: Needs
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport
 * Generated from column metadata
 */
export interface Needs {

  Need_ID: number /* 32-bit integer */; // Primary Key

  Requester_Contact: number /* 32-bit integer */; // Foreign Key -> Contacts.Contact_ID

  /**
   * Max length: 15 characters
   */
  Postal_Code?: string /* max 15 chars */ | null;

  Need_Campaign_ID: number /* 32-bit integer */; // Foreign Key -> Need_Campaigns.Need_Campaign_ID

  Need_Type_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Need_Types.Need_Type_ID

  /**
   * Max length: 255 characters
   */
  Other_Need?: string /* max 255 chars */ | null;

  Target_Date?: string /* ISO datetime */ | null;

  Complete: boolean; // Has Default

  Need_Provider_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Need_Providers.Need_Provider_ID

  Date_Assigned?: string /* ISO datetime */ | null;

  /**
   * Max length: 500 characters
   */
  Notes?: string /* max 500 chars */ | null;

  Need_Guid: string /* GUID/UUID */; // Has Default

  Care_Case_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Care_Cases.Care_Case_ID
}

export type NeedsRecord = Needs;
