/**
 * Interface for Texting_Compliance_Levels
* Table: Texting_Compliance_Levels
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport
 * Generated from column metadata
 */
export interface TextingComplianceLevels {

  Texting_Compliance_Level_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Texting_Compliance_Level: string /* max 50 chars */;
}

export type TextingComplianceLevelsRecord = TextingComplianceLevels;
