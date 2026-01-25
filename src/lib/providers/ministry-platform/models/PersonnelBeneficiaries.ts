/**
 * Interface for Personnel_Beneficiaries
* Table: Personnel_Beneficiaries
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface PersonnelBeneficiaries {

  Personnel_Beneficiary_ID: number /* 32-bit integer */; // Primary Key

  Personnel_ID: number /* 32-bit integer */; // Foreign Key -> Personnel.Personnel_ID

  Contact_ID: number /* 32-bit integer */; // Foreign Key -> Contacts.Contact_ID

  Beneficiary_Relationship_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Beneficiary_Relationships.Beneficiary_Relationship_ID

  /**
   * Max length: 2000 characters
   */
  Notes?: string /* max 2000 chars */ | null;
}

export type PersonnelBeneficiariesRecord = PersonnelBeneficiaries;
