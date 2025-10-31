/**
 * Interface for Staff_Timeaway_Requests
* Table: Staff_Timeaway_Requests
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface StaffTimeawayRequests {

  Request_ID: number /* 32-bit integer */; // Primary Key

  Staff_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Staff.Staff_ID

  Date_Created: string /* ISO datetime */; // Has Default

  Benefit_Year_ID: number /* 32-bit integer */; // Foreign Key -> Benefit_Years.Benefit_Year_ID

  /**
   * Max length: 100 characters
   */
  Name: string /* max 100 chars */; // Has Default

  Status_ID: number /* 32-bit integer */; // Foreign Key -> Staff_Timeaway_Request_Statuses.Status_ID, Has Default

  /**
   * Max length: 2147483647 characters
   */
  Notes?: string /* max 2147483647 chars */ | null;

  HR_Approver?: number /* 32-bit integer */ | null; // Foreign Key -> Staff.Staff_ID

  HR_Approval_Date?: string /* ISO datetime */ | null;

  Supervisor_Approver?: number /* 32-bit integer */ | null; // Foreign Key -> Staff.Staff_ID

  Supervisor_Approval_Date?: string /* ISO datetime */ | null;

  /**
   * Max length: 1000 characters
   */
  Reason_Denied?: string /* max 1000 chars */ | null;
}

export type StaffTimeawayRequestsRecord = StaffTimeawayRequests;
