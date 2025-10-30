/**
 * Interface for Contact_Relationships
* Table: Contact_Relationships
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface ContactRelationships {

  Contact_Relationship_ID: number /* 32-bit integer */; // Primary Key

  Contact_ID: number /* 32-bit integer */; // Foreign Key -> Contacts.Contact_ID

  Relationship_ID: number /* 32-bit integer */; // Foreign Key -> Relationships.Relationship_ID

  Related_Contact_ID: number /* 32-bit integer */; // Foreign Key -> Contacts.Contact_ID

  Start_Date?: string /* ISO datetime */ | null;

  End_Date?: string /* ISO datetime */ | null;

  /**
   * Max length: 255 characters
   */
  Notes?: string /* max 255 chars */ | null;

  _Triggered_By?: number /* 32-bit integer */ | null; // Read Only
}

export type ContactRelationshipsRecord = ContactRelationships;
