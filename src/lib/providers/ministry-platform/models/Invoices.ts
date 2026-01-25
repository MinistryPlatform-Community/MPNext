/**
 * Interface for Invoices
* Table: Invoices
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface Invoices {

  Invoice_ID: number /* 32-bit integer */; // Primary Key

  Purchaser_Contact_ID: number /* 32-bit integer */; // Foreign Key -> Contacts.Contact_ID

  Invoice_Status_ID: number /* 32-bit integer */; // Foreign Key -> Invoice_Statuses.Invoice_Status_ID

  Invoice_Total: number /* currency amount */;

  Invoice_Date: string /* ISO datetime */;

  /**
   * Max length: 4000 characters
   */
  Notes?: string /* max 4000 chars */ | null;

  /**
   * Max length: 25 characters
   */
  Currency?: string /* max 25 chars */ | null;

  Congregation_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Congregations.Congregation_ID

  Invoice_GUID: string /* GUID/UUID */; // Has Default

  Invoice_Source?: number /* 32-bit integer */ | null; // Foreign Key -> Invoice_Sources.Invoice_Source_ID

  /**
   * Max length: 255 characters
   */
  Cancel_Reason?: string /* max 255 chars */ | null;
}

export type InvoicesRecord = Invoices;
