/**
 * Interface for Product_Option_Groups
* Table: Product_Option_Groups
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface ProductOptionGroups {

  Product_Option_Group_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Option_Group_Name: string /* max 50 chars */;

  Product_ID: number /* 32-bit integer */; // Foreign Key -> Products.Product_ID

  /**
   * Max length: 255 characters
   */
  Description?: string /* max 255 chars */ | null;

  Mutually_Exclusive: boolean;

  Required: boolean;

  /**
   * Max length: 50 characters
   */
  Note_Label?: string /* max 50 chars */ | null;

  Online_Sort_Order?: number /* 32-bit integer */ | null;
}

export type ProductOptionGroupsRecord = ProductOptionGroups;
