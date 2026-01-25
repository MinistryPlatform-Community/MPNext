/**
 * Interface for dp_Communication_Types
* Table: dp_Communication_Types
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface DpCommunicationTypes {

  Communication_Type_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 25 characters
   */
  Communication_Type: string /* max 25 chars */;
}

export type DpCommunicationTypesRecord = DpCommunicationTypes;
