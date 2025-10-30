/**
 * Interface for dp_Configuration_Settings
* Table: dp_Configuration_Settings
 * Access Level: ReadWrite
 * Special Permissions: DataExport
 * Generated from column metadata
 */
export interface DpConfigurationSettings {

  Configuration_Setting_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Application_Code: string /* max 50 chars */;

  /**
   * Max length: 128 characters
   */
  Key_Name: string /* max 128 chars */;

  /**
   * Max length: 4000 characters
   */
  Value?: string /* max 4000 chars */ | null;

  /**
   * Max length: 2000 characters
   */
  Description?: string /* max 2000 chars */ | null;

  /**
   * Max length: 250 characters
   */
  _Warning?: string /* max 250 chars */ | null; // Read Only, Has Default

  Primary_Key_Page_ID?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Pages.Page_ID
}

export type DpConfigurationSettingsRecord = DpConfigurationSettings;
