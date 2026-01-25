/**
 * Interface for Payment_Types
* Table: Payment_Types
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface PaymentTypes {

  Payment_Type_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Payment_Type: string /* max 50 chars */;

  /**
   * Max length: 255 characters
   */
  Description?: string /* max 255 chars */ | null;

  Omit_Amount_On_Statement: boolean; // Has Default

  Is_Online: boolean; // Has Default
}

export type PaymentTypesRecord = PaymentTypes;
