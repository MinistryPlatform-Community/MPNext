/**
 * Interface for Member_Statuses
* Table: Member_Statuses
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface MemberStatuses {

  Member_Status_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Member_Status: string /* max 50 chars */;

  Can_Access_Directory: boolean; // Has Default

  Show_In_Directory: boolean; // Has Default
}

export type MemberStatusesRecord = MemberStatuses;
