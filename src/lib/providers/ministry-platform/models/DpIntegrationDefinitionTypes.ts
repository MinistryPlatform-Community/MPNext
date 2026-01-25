/**
 * Interface for dp_Integration_Definition_Types
* Table: dp_Integration_Definition_Types
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface DpIntegrationDefinitionTypes {

  Integration_Definition_Type_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Display_Name: string /* max 50 chars */;
}

export type DpIntegrationDefinitionTypesRecord = DpIntegrationDefinitionTypes;
