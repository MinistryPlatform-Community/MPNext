/**
 * Interface for Product_Option_Prices
* Table: Product_Option_Prices
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface ProductOptionPrices {

  Product_Option_Price_ID: number /* 32-bit integer */; // Primary Key

  Product_Option_Group_ID: number /* 32-bit integer */; // Foreign Key -> Product_Option_Groups.Product_Option_Group_ID

  Option_Price: number /* currency amount */;

  /**
   * Max length: 50 characters
   */
  Option_Title: string /* max 50 chars */;

  Active: boolean;

  Qty_Allowed: number /* 32-bit integer */;

  Add_to_Group?: number /* 32-bit integer */ | null; // Foreign Key -> Groups.Group_ID

  Sort_Order?: number /* 32-bit integer */ | null;

  Max_Qty?: number /* 32-bit integer */ | null;

  Days_Out_To_Hide?: number /* 32-bit integer */ | null;

  /**
   * Max length: 20 characters
   */
  Promo_Code?: string /* max 20 chars */ | null;

  Min_Qty?: number /* 32-bit integer */ | null;

  Attending_Online: boolean; // Has Default
}

export type ProductOptionPricesRecord = ProductOptionPrices;
