/**
 * Interface for Benefit_Types
* Table: Benefit_Types
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface BenefitTypes {

  Benefit_Type_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Benefit_Type: string /* max 50 chars */;
}

export type BenefitTypesRecord = BenefitTypes;
