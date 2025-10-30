/**
 * Interface for Audience_Operators
* Table: Audience_Operators
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface AudienceOperators {

  Operator_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Operator: string /* max 50 chars */;
}

export type AudienceOperatorsRecord = AudienceOperators;
