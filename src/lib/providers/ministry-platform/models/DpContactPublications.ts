/**
 * Interface for dp_Contact_Publications
* Table: dp_Contact_Publications
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport
 * Generated from column metadata
 */
export interface DpContactPublications {

  Contact_Publication_ID: number /* 32-bit integer */; // Primary Key

  Contact_ID: number /* 32-bit integer */; // Foreign Key -> Contacts.Contact_ID

  Publication_ID: number /* 32-bit integer */; // Foreign Key -> dp_Publications.Publication_ID

  Unsubscribed: boolean; // Has Default

  /**
   * Max length: 255 characters
   */
  _Synced_List_Name?: string /* max 255 chars */ | null; // Read Only

  /**
   * Max length: 50 characters
   */
  External_List_ID?: string /* max 50 chars */ | null;

  _Unsubscribe_Sync_Pending: boolean; // Read Only, Has Default
}

export type DpContactPublicationsRecord = DpContactPublications;
