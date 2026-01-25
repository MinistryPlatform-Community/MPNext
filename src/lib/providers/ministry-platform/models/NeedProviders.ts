/**
 * Interface for Need_Providers
* Table: Need_Providers
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport
 * Generated from column metadata
 */
export interface NeedProviders {

  Need_Provider_ID: number /* 32-bit integer */; // Primary Key

  Contact_ID: number /* 32-bit integer */; // Foreign Key -> Contacts.Contact_ID
}

export type NeedProvidersRecord = NeedProviders;
