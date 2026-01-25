/**
 * Interface for Personnel_Ordination
* Table: Personnel_Ordination
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface PersonnelOrdination {

  Personnel_Ordination_ID: number /* 32-bit integer */; // Primary Key

  Personnel_ID: number /* 32-bit integer */; // Foreign Key -> Personnel.Personnel_ID

  Deacon_Ordained_Here?: number /* 32-bit integer */ | null; // Foreign Key -> Church_Associations.Church_Association_ID

  /**
   * Max length: 100 characters
   */
  Deacon_Ordained_By?: string /* max 100 chars */ | null;

  /**
   * Max length: 100 characters
   */
  First_Mass?: string /* max 100 chars */ | null;

  Candidacy?: string /* ISO date (YYYY-MM-DD) */ | null;

  Rite_Of_Lector?: string /* ISO date (YYYY-MM-DD) */ | null;

  Rite_Of_Acolyte?: string /* ISO date (YYYY-MM-DD) */ | null;

  Date_To_Priesthood?: string /* ISO date (YYYY-MM-DD) */ | null;

  Religious_Order_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Religious_Orders.Religious_Order_ID

  Religious_Order_Status_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Religious_Order_Statuses.Religious_Order_Status_ID

  Incardination_Date?: string /* ISO date (YYYY-MM-DD) */ | null;

  /**
   * Max length: 100 characters
   */
  Place_of_Incardination?: string /* max 100 chars */ | null;

  Profession_Of_Faith?: boolean | null;

  Letter_Of_Suitability?: boolean | null;

  Excardination_Date?: string /* ISO date (YYYY-MM-DD) */ | null;

  /**
   * Max length: 100 characters
   */
  Place_of_Excardination?: string /* max 100 chars */ | null;

  Date_of_Arrival?: string /* ISO date (YYYY-MM-DD) */ | null;

  Date_of_Departure?: string /* ISO date (YYYY-MM-DD) */ | null;

  /**
   * Max length: 2147483647 characters
   */
  Comments?: string /* max 2147483647 chars */ | null;

  Date_of_Deacon_Ordination?: string /* ISO date (YYYY-MM-DD) */ | null;

  Priesthood_Date_of_Ordination?: string /* ISO date (YYYY-MM-DD) */ | null;

  Priesthood_Ordained_Here?: number /* 32-bit integer */ | null; // Foreign Key -> Church_Associations.Church_Association_ID

  /**
   * Max length: 100 characters
   */
  Priesthood_Ordained_By?: string /* max 100 chars */ | null;

  Date_of_First_Profession?: string /* ISO date (YYYY-MM-DD) */ | null;

  Date_of_Profession?: string /* ISO date (YYYY-MM-DD) */ | null;
}

export type PersonnelOrdinationRecord = PersonnelOrdination;
