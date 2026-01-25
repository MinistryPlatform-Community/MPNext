/**
 * Interface for Print_Servers
* Table: Print_Servers
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport
 * Generated from column metadata
 */
export interface PrintServers {

  Print_Server_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 128 characters
   */
  Machine_Name: string /* max 128 chars */;

  /**
   * Max length: 255 characters
   */
  Description?: string /* max 255 chars */ | null;
}

export type PrintServersRecord = PrintServers;
