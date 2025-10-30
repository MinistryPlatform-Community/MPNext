/**
 * Interface for Invoice_Sources
* Table: Invoice_Sources
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface InvoiceSources {

  Invoice_Source_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Invoice_Source: string /* max 50 chars */;
}

export type InvoiceSourcesRecord = InvoiceSources;
