/**
 * Interface for Pledge_Adjustment_Types
* Table: Pledge_Adjustment_Types
 * Access Level: Read
 * Special Permissions: None
 * Generated from column metadata
 */
export interface PledgeAdjustmentTypes {

  Pledge_Adjustment_Type_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 128 characters
   */
  Pledge_Adjustment_Type: string /* max 128 chars */;
}

export type PledgeAdjustmentTypesRecord = PledgeAdjustmentTypes;
