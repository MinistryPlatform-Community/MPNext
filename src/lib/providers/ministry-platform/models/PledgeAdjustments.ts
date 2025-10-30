/**
 * Interface for Pledge_Adjustments
* Table: Pledge_Adjustments
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface PledgeAdjustments {

  Pledge_Adjustment_ID: number /* 32-bit integer */; // Primary Key

  Pledge_ID: number /* 32-bit integer */; // Foreign Key -> Pledges.Pledge_ID

  Pledge_Adjustment_Type_ID: number /* 32-bit integer */; // Foreign Key -> Pledge_Adjustment_Types.Pledge_Adjustment_Type_ID

  Adjustment_Date: string /* ISO datetime */;

  Adjustment_Amount: number /* currency amount */;

  Prior_Amount: number /* currency amount */;

  /**
   * Max length: 2000 characters
   */
  Notes?: string /* max 2000 chars */ | null;
}

export type PledgeAdjustmentsRecord = PledgeAdjustments;
