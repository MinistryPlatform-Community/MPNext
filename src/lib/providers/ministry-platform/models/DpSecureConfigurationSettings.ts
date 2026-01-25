/**
 * Interface for dp_Secure_Configuration_Settings
* Table: dp_Secure_Configuration_Settings
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface DpSecureConfigurationSettings {

  Secure_Configuration_Setting_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Application_Code: string /* max 50 chars */;

  /**
   * Max length: 128 characters
   */
  Key_Name: string /* max 128 chars */;

  Value?: Blob | string /* binary data */ | null;

  /**
   * Max length: 2000 characters
   */
  Description?: string /* max 2000 chars */ | null;

  /**
   * Max length: 250 characters
   */
  _Warning?: string /* max 250 chars */ | null; // Read Only, Has Default
}

export type DpSecureConfigurationSettingsRecord = DpSecureConfigurationSettings;
