/**
 * Interface for Personnel_Benefits
* Table: Personnel_Benefits
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface PersonnelBenefits {

  Personnel_Benefit_ID: number /* 32-bit integer */; // Primary Key

  Personnel_ID: number /* 32-bit integer */; // Foreign Key -> Personnel.Personnel_ID

  Benefit_Type_ID: number /* 32-bit integer */; // Foreign Key -> Benefit_Types.Benefit_Type_ID

  Start_Date?: string /* ISO datetime */ | null;

  Expiration_Date?: string /* ISO datetime */ | null;

  /**
   * Max length: 2000 characters
   */
  Benefit_Notes?: string /* max 2000 chars */ | null;
}

export type PersonnelBenefitsRecord = PersonnelBenefits;
