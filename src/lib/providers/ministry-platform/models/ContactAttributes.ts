/**
 * Interface for Contact_Attributes
* Table: Contact_Attributes
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface ContactAttributes {

  Contact_Attribute_ID: number /* 32-bit integer */; // Primary Key

  Contact_ID: number /* 32-bit integer */; // Foreign Key -> Contacts.Contact_ID

  Attribute_ID: number /* 32-bit integer */; // Foreign Key -> Attributes.Attribute_ID

  Start_Date: string /* ISO datetime */;

  End_Date?: string /* ISO datetime */ | null;

  /**
   * Max length: 2000 characters
   */
  Notes?: string /* max 2000 chars */ | null;
}

export type ContactAttributesRecord = ContactAttributes;
