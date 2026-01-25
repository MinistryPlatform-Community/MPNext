/**
 * Interface for Invoice_Statuses
* Table: Invoice_Statuses
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface InvoiceStatuses {

  Invoice_Status_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Invoice_Status: string /* max 50 chars */;

  /**
   * Max length: 255 characters
   */
  Description?: string /* max 255 chars */ | null;
}

export type InvoiceStatusesRecord = InvoiceStatuses;
