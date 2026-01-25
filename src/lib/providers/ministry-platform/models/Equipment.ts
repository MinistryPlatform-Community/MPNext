/**
 * Interface for Equipment
* Table: Equipment
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface Equipment {

  Equipment_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Equipment_Name: string /* max 50 chars */;

  Date_Acquired: string /* ISO datetime */;

  Equipment_Type_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Equipment_Types.Equipment_Type_ID

  Room_ID: number /* 32-bit integer */; // Foreign Key -> Rooms.Room_ID

  /**
   * Max length: 50 characters
   */
  Model_Name?: string /* max 50 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Serial_Number?: string /* max 50 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Inventory_Number?: string /* max 50 chars */ | null;

  Bookable: boolean; // Has Default

  Separately_Insured: boolean; // Has Default

  Purchase_Price?: number /* currency amount */ | null;

  Date_Retired?: string /* ISO datetime */ | null;

  Equipment_Coordinator?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Users.User_ID

  Auto_Approve: boolean; // Has Default

  Quantity: number /* 32-bit integer */; // Has Default
}

export type EquipmentRecord = Equipment;
