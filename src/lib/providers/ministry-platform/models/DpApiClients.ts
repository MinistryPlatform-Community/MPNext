/**
 * Interface for dp_API_Clients
* Table: dp_API_Clients
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport
 * Generated from column metadata
 */
export interface DpApiClients {

  API_Client_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 128 characters
   */
  Display_Name: string /* max 128 chars */;

  /**
   * Max length: 128 characters
   */
  Client_ID: string /* max 128 chars */;

  Client_Secret?: string /* secret key */ | null;

  Client_User_ID?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Users.User_ID

  Authentication_Flow_ID: number /* 32-bit integer */; // Foreign Key -> dp_Authentication_Flows.Authentication_Flow_ID, Has Default

  /**
   * Max length: 4000 characters
   */
  Redirect_URIs?: string /* max 4000 chars */ | null;

  /**
   * Max length: 4000 characters
   */
  Post_Logout_Redirect_URIs?: string /* max 4000 chars */ | null;

  Access_Token_Lifetime: number /* 32-bit integer */; // Has Default

  Identity_Token_Lifetime: number /* 32-bit integer */; // Has Default

  Refresh_Token_Lifetime: number /* 32-bit integer */; // Has Default

  Authorization_Code_Lifetime: number /* 32-bit integer */; // Has Default

  Is_Enabled: boolean; // Has Default

  Encryption_Key?: string /* secret key */ | null;

  Is_Rotating_Refresh_Token: boolean; // Has Default
}

export type DpApiClientsRecord = DpApiClients;
