/**
 * Interface for Personnel_Estate_Plans
* Table: Personnel_Estate_Plans
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface PersonnelEstatePlans {

  Personnel_Estate_Plan_ID: number /* 32-bit integer */; // Primary Key

  Personnel_ID: number /* 32-bit integer */; // Foreign Key -> Personnel.Personnel_ID

  Living_Will_Last_Updated?: string /* ISO date (YYYY-MM-DD) */ | null;

  /**
   * Max length: 100 characters
   */
  Living_Will_Filed_At?: string /* max 100 chars */ | null;

  /**
   * Max length: 150 characters
   */
  Living_Will_Surrogate_Name?: string /* max 150 chars */ | null;

  /**
   * Max length: 150 characters
   */
  Living_Will_Relationship?: string /* max 150 chars */ | null;

  /**
   * Max length: 500 characters
   */
  Living_Will_Address?: string /* max 500 chars */ | null;

  /**
   * Max length: 100 characters
   */
  Living_Will_Phones?: string /* max 100 chars */ | null;

  Living_Will_Advance_Health_Directive?: boolean | null;

  /**
   * Max length: 100 characters
   */
  Power_of_Attorney_Filed_At?: string /* max 100 chars */ | null;

  Power_of_Attorney_Date_Completed?: string /* ISO date (YYYY-MM-DD) */ | null;

  Power_of_Attorney_Copy_to_PCP?: boolean | null;

  Power_of_Attorney_Agent_Has_Copy?: boolean | null;

  Will_Last_Updated_Date?: string /* ISO date (YYYY-MM-DD) */ | null;

  /**
   * Max length: 100 characters
   */
  Will_Filed_At?: string /* max 100 chars */ | null;

  /**
   * Max length: 150 characters
   */
  Will_Executor_Name?: string /* max 150 chars */ | null;

  /**
   * Max length: 500 characters
   */
  Will_Address?: string /* max 500 chars */ | null;

  /**
   * Max length: 100 characters
   */
  Will_Phones?: string /* max 100 chars */ | null;

  /**
   * Max length: 100 characters
   */
  Funeral_Filed_At?: string /* max 100 chars */ | null;

  /**
   * Max length: 150 characters
   */
  Funeral_Service_Location?: string /* max 150 chars */ | null;

  /**
   * Max length: 150 characters
   */
  Funeral_Presider?: string /* max 150 chars */ | null;

  /**
   * Max length: 150 characters
   */
  Funeral_Homilist?: string /* max 150 chars */ | null;

  /**
   * Max length: 500 characters
   */
  Funeral_Place_of_Interment?: string /* max 500 chars */ | null;

  Beneficiary_On_File?: boolean | null; // Has Default

  /**
   * Max length: 2000 characters
   */
  Beneficiary_Notes?: string /* max 2000 chars */ | null;
}

export type PersonnelEstatePlansRecord = PersonnelEstatePlans;
