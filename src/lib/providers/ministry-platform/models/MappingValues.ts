/**
 * Interface for Mapping_Values
* Table: Mapping_Values
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface MappingValues {

  Mapping_Value_ID: number /* 32-bit integer */; // Primary Key

  MP_FK?: number /* 32-bit integer */ | null;

  Other_FK: number /* 32-bit integer */;

  /**
   * Max length: 50 characters
   */
  Type: string /* max 50 chars */;

  /**
   * Max length: 50 characters
   */
  Sub_Type: string /* max 50 chars */;
}

export type MappingValuesRecord = MappingValues;
