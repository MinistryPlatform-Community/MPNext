/**
 * Interface for Secure_Comment_Types
* Table: Secure_Comment_Types
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface SecureCommentTypes {

  Secure_Comment_Type_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Secure_Comment_Type: string /* max 50 chars */;

  /**
   * Max length: 50 characters
   */
  Red_Flag_Notes?: string /* max 50 chars */ | null;
}

export type SecureCommentTypesRecord = SecureCommentTypes;
