/**
 * Interface for Certification_Types
* Table: Certification_Types
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface CertificationTypes {

  Certification_Type_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Certification_Type: string /* max 50 chars */;

  /**
   * Max length: 256 characters
   */
  Description?: string /* max 256 chars */ | null;

  Months_Till_Expires: number /* 32-bit integer */;

  Expiring_Soon_Days?: number /* 32-bit integer */ | null;

  /**
   * Max length: 75 characters
   */
  Vendor_ID?: string /* max 75 chars */ | null;
}

export type CertificationTypesRecord = CertificationTypes;
