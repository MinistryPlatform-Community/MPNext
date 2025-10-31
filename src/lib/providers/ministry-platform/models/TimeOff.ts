/**
 * Interface for Time_Off
* Table: Time_Off
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface TimeOff {

  Time_Off_ID: number /* 32-bit integer */; // Primary Key

  Staff_Member: number /* 32-bit integer */; // Foreign Key -> dp_Users.User_ID

  Time_Off_Type_ID: number /* 32-bit integer */; // Foreign Key -> Time_Off_Types.Time_Off_Type_ID

  Request_Status_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Request_Statuses.Request_Status_ID

  First_Workday_Missed: string /* ISO datetime */;

  Last_Workday_Missed: string /* ISO datetime */;

  Return_Date: string /* ISO datetime */;

  Work_Hours_Missed: number /* 16-bit integer */;

  /**
   * Max length: 500 characters
   */
  Notes?: string /* max 500 chars */ | null;

  _Approved?: boolean | null; // Read Only

  /**
   * Max length: 500 characters
   */
  Supervisor_Note?: string /* max 500 chars */ | null;

  /**
   * Max length: 500 characters
   */
  HR_Note?: string /* max 500 chars */ | null;
}

export type TimeOffRecord = TimeOff;
