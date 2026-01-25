/**
 * Interface for Batches
* Table: Batches
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface Batches {

  Batch_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 75 characters
   */
  Batch_Name: string /* max 75 chars */;

  Setup_Date: string /* ISO datetime */;

  Batch_Total: number /* currency amount */;

  Item_Count: number /* 16-bit integer */; // Has Default

  Batch_Entry_Type_ID: number /* 32-bit integer */; // Foreign Key -> Batch_Entry_Types.Batch_Entry_Type_ID, Has Default

  Batch_Type_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Batch_Types.Batch_Type_ID

  Default_Program?: number /* 32-bit integer */ | null; // Foreign Key -> Programs.Program_ID

  Source_Event?: number /* 32-bit integer */ | null; // Foreign Key -> Events.Event_ID

  Deposit_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Deposits.Deposit_ID

  Finalize_Date?: string /* ISO datetime */ | null;

  Congregation_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Congregations.Congregation_ID

  _Import_Counter?: number /* 16-bit integer */ | null; // Read Only

  /**
   * Max length: 50 characters
   */
  _Source_File?: string /* max 50 chars */ | null; // Read Only

  Default_Payment_Type?: number /* 32-bit integer */ | null; // Foreign Key -> Payment_Types.Payment_Type_ID, Has Default

  /**
   * Max length: 25 characters
   */
  Currency?: string /* max 25 chars */ | null; // Has Default

  Operator_User?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Users.User_ID

  /**
   * Max length: 64 characters
   */
  Default_Program_ID_List?: string /* max 64 chars */ | null;

  Expected_Total_Pledge_Amount?: number /* currency amount */ | null; // Has Default

  Expected_Number_of_Pledges?: number /* 32-bit integer */ | null; // Has Default

  Batch_Usage_Type_ID: number /* 32-bit integer */; // Foreign Key -> Batch_Usage_Types.Batch_Usage_Type_ID, Has Default

  Pledge_Campaign_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Pledge_Campaigns.Pledge_Campaign_ID
}

export type BatchesRecord = Batches;
