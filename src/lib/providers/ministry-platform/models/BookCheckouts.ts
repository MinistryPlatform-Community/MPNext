/**
 * Interface for Book_Checkouts
* Table: Book_Checkouts
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface BookCheckouts {

  Book_Checkout_ID: number /* 32-bit integer */; // Primary Key, Foreign Key -> Book_Checkouts.Book_Checkout_ID

  Book_ID: number /* 32-bit integer */; // Foreign Key -> Books.Book_ID

  Contact_ID: number /* 32-bit integer */; // Foreign Key -> Contacts.Contact_ID

  Checkout_Date: string /* ISO datetime */;

  Due_Date?: string /* ISO datetime */ | null; // Read Only, Computed

  Date_Returned?: string /* ISO datetime */ | null;

  /**
   * Max length: 2147483647 characters
   */
  Notes?: string /* max 2147483647 chars */ | null;

  Is_Returned: number /* 32-bit integer */; // Read Only, Computed
}

export type BookCheckoutsRecord = BookCheckouts;
