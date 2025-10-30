/**
 * Interface for Payments
* Table: Payments
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface Payments {

  Payment_ID: number /* 32-bit integer */; // Primary Key

  Payment_Total: number /* currency amount */;

  Contact_ID: number /* 32-bit integer */; // Foreign Key -> Contacts.Contact_ID

  Payment_Date: string /* ISO datetime */;

  /**
   * Max length: 500 characters
   */
  Gateway_Response?: string /* max 500 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Transaction_Code?: string /* max 50 chars */ | null;

  /**
   * Max length: 4000 characters
   */
  Notes?: string /* max 4000 chars */ | null;

  /**
   * Max length: 25 characters
   */
  Merchant_Batch?: string /* max 25 chars */ | null;

  Payment_Type_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Payment_Types.Payment_Type_ID

  /**
   * Max length: 15 characters
   */
  Item_Number?: string /* max 15 chars */ | null;

  Processed?: boolean | null;

  /**
   * Max length: 25 characters
   */
  Currency?: string /* max 25 chars */ | null;

  /**
   * Max length: 25 characters
   */
  Invoice_Number?: string /* max 25 chars */ | null;

  Congregation_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Congregations.Congregation_ID

  Invoice_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Invoices.Invoice_ID
}

export type PaymentsRecord = Payments;
