/**
 * Interface for Attribute_Types
* Table: Attribute_Types
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface AttributeTypes {

  Attribute_Type_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Attribute_Type: string /* max 50 chars */;

  /**
   * Max length: 255 characters
   */
  Description?: string /* max 255 chars */ | null;

  Available_Online: boolean; // Has Default

  Online_Sort_Order?: number /* 32-bit integer */ | null;
}

export type AttributeTypesRecord = AttributeTypes;
