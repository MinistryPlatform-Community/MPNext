/**
 * Interface for Service_Types
* Table: Service_Types
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface ServiceTypes {

  Service_Type_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Service_Type: string /* max 50 chars */;
}

export type ServiceTypesRecord = ServiceTypes;
