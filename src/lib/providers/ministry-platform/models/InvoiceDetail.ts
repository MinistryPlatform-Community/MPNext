/**
 * Interface for Invoice_Detail
* Table: Invoice_Detail
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface InvoiceDetail {

  Invoice_Detail_ID: number /* 32-bit integer */; // Primary Key

  Invoice_ID: number /* 32-bit integer */; // Foreign Key -> Invoices.Invoice_ID

  Recipient_Contact_ID: number /* 32-bit integer */; // Foreign Key -> Contacts.Contact_ID

  Event_Participant_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Event_Participants.Event_Participant_ID

  Item_Quantity: number /* 32-bit integer */;

  Line_Total: number /* currency amount */;

  Product_ID: number /* 32-bit integer */; // Foreign Key -> Products.Product_ID

  Product_Option_Price_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Product_Option_Prices.Product_Option_Price_ID

  /**
   * Max length: 500 characters
   */
  Item_Note?: string /* max 500 chars */ | null;

  /**
   * Max length: 75 characters
   */
  Recipient_Name?: string /* max 75 chars */ | null;

  /**
   * Max length: 500 characters
   */
  Recipient_Address?: string /* max 500 chars */ | null;

  /**
   * Max length: 254 characters
   */
  Recipient_Email?: string /* email, max 254 chars */ | null;

  Recipient_Phone?: string /* phone number */ | null;

  Deposit_Requested: boolean; // Has Default
}

export type InvoiceDetailRecord = InvoiceDetail;
