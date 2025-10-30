/**
 * Interface for Products
* Table: Products
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface Products {

  Product_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Product_Name: string /* max 50 chars */;

  Congregation_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Congregations.Congregation_ID

  /**
   * Max length: 2147483647 characters
   */
  Description?: string /* max 2147483647 chars */ | null;

  Base_Price: number /* currency amount */;

  Deposit_Price?: number /* currency amount */ | null;

  Active: boolean;

  Price_Currency?: number /* 32-bit integer */ | null; // Foreign Key -> Currencies.Currency_ID
}

export type ProductsRecord = Products;
