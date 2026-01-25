/**
 * Interface for Currencies
* Table: Currencies
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface Currencies {

  Currency_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Currency_Name: string /* max 50 chars */;

  /**
   * Max length: 10 characters
   */
  Currency_Abbrev: string /* max 10 chars */;

  Allow_Online: boolean; // Has Default
}

export type CurrenciesRecord = Currencies;
