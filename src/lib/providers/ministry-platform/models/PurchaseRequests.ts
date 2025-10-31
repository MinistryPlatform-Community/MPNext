/**
 * Interface for Purchase_Requests
* Table: Purchase_Requests
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface PurchaseRequests {

  Purchase_Request_ID: number /* 32-bit integer */; // Primary Key

  Submitted_By: number /* 32-bit integer */; // Foreign Key -> dp_Users.User_ID

  Ministry_ID: number /* 32-bit integer */; // Foreign Key -> Ministries.Ministry_ID

  /**
   * Max length: 50 characters
   */
  Item_Name: string /* max 50 chars */;

  /**
   * Max length: 4000 characters
   */
  Description?: string /* max 4000 chars */ | null;

  Priority_Level: number /* 32-bit integer */; // Foreign Key -> Item_Priorities.Item_Priority_ID

  Amount_Needed: number /* currency amount */;

  Date_Submitted: string /* ISO datetime */; // Has Default

  Date_Needed?: string /* ISO datetime */ | null;

  Department_Number?: number /* 32-bit integer */ | null;

  Account_Number?: number /* 32-bit integer */ | null;

  /**
   * Max length: 500 characters
   */
  Approval_Note?: string /* max 500 chars */ | null;

  Closed: boolean;

  _Approved?: boolean | null; // Read Only
}

export type PurchaseRequestsRecord = PurchaseRequests;
