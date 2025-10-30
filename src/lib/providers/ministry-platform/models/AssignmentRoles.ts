/**
 * Interface for Assignment_Roles
* Table: Assignment_Roles
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface AssignmentRoles {

  Assignment_Role_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Assignment_Role: string /* max 50 chars */;
}

export type AssignmentRolesRecord = AssignmentRoles;
