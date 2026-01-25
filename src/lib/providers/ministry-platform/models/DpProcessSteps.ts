/**
 * Interface for dp_Process_Steps
* Table: dp_Process_Steps
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface DpProcessSteps {

  Process_Step_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Step_Name: string /* max 50 chars */;

  /**
   * Max length: 500 characters
   */
  Instructions?: string /* max 500 chars */ | null;

  Process_Step_Type_ID: number /* 32-bit integer */; // Foreign Key -> dp_Process_Step_Types.Process_Step_Type_ID

  Escalation_Only: boolean; // Has Default

  Order: number /* 16-bit integer */;

  Process_ID: number /* 32-bit integer */; // Foreign Key -> dp_Processes.Process_ID

  Specific_User?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Users.User_ID

  Supervisor_User: boolean;

  /**
   * Max length: 1000 characters
   */
  Lookup_User_Field?: string /* max 1000 chars */ | null;

  Escalate_to_Step?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Process_Steps.Process_Step_ID

  Task_Deadline?: number /* 16-bit integer */ | null;

  Email_Template?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Communication_Templates.Communication_Template_ID

  To_Specific_Contact?: number /* 32-bit integer */ | null; // Foreign Key -> Contacts.Contact_ID

  /**
   * Max length: 1000 characters
   */
  Email_To_Contact_Field?: string /* max 1000 chars */ | null;

  /**
   * Max length: 1000 characters
   */
  SQL_Statement?: string /* max 1000 chars */ | null;

  Webhook_ID?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Webhooks.Webhook_ID

  Text_Template?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Communication_Templates.Communication_Template_ID

  /**
   * Max length: 1000 characters
   */
  Text_To_Contact_Field?: string /* max 1000 chars */ | null;

  Specific_User_Group_ID?: number /* 32-bit integer */ | null; // Foreign Key -> dp_User_Groups.User_Group_ID

  Completion_Rule_ID?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Completion_Rules.Completion_Rule_ID
}

export type DpProcessStepsRecord = DpProcessSteps;
