/**
 * Interface for Equipment_Types
* Table: Equipment_Types
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface EquipmentTypes {

  Equipment_Type_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Equipment_Type: string /* max 50 chars */;

  /**
   * Max length: 255 characters
   */
  Description?: string /* max 255 chars */ | null;
}

export type EquipmentTypesRecord = EquipmentTypes;
