/**
 * Interface for _Deployments
* Table: _Deployments
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface Deployments {

  Deployment_ID: number /* 32-bit integer */; // Primary Key

  Deployment_Date: string /* ISO datetime */;

  /**
   * Max length: 16 characters
   */
  Application_Code: string /* max 16 chars */;

  /**
   * Max length: 16 characters
   */
  Build_Version: string /* max 16 chars */;

  /**
   * Max length: 255 characters
   */
  Notes?: string /* max 255 chars */ | null;
}

export type DeploymentsRecord = Deployments;
