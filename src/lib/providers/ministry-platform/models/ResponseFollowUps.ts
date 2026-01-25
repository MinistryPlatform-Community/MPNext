/**
 * Interface for Response_Follow_Ups
* Table: Response_Follow_Ups
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface ResponseFollowUps {

  Response_Follow_Up_ID: number /* 32-bit integer */; // Primary Key

  Response_ID: number /* 32-bit integer */; // Foreign Key -> Responses.Response_ID

  Follow_Up_Date: string /* ISO datetime */;

  Action_Type_ID: number /* 32-bit integer */; // Foreign Key -> Follow_Up_Action_Types.Action_Type_ID

  /**
   * Max length: 1000 characters
   */
  Notes: string /* max 1000 chars */;

  Made_By?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Users.User_ID
}

export type ResponseFollowUpsRecord = ResponseFollowUps;
