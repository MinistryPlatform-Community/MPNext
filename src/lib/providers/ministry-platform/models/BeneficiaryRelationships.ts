/**
 * Interface for Beneficiary_Relationships
* Table: Beneficiary_Relationships
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface BeneficiaryRelationships {

  Beneficiary_Relationship_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 75 characters
   */
  Beneficiary_Relationship: string /* max 75 chars */;
}

export type BeneficiaryRelationshipsRecord = BeneficiaryRelationships;
