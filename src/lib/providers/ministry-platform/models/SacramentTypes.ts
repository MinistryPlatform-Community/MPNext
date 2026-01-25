/**
 * Interface for Sacrament_Types
* Table: Sacrament_Types
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface SacramentTypes {

  Sacrament_Type_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Sacrament_Type: string /* max 50 chars */;

  Active: boolean; // Has Default
}

export type SacramentTypesRecord = SacramentTypes;
