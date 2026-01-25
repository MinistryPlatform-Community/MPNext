/**
 * Interface for Event_Equipment
* Table: Event_Equipment
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface EventEquipment {

  Event_Equipment_ID: number /* 32-bit integer */; // Primary Key

  Event_ID: number /* 32-bit integer */; // Foreign Key -> Events.Event_ID

  Equipment_ID: number /* 32-bit integer */; // Foreign Key -> Equipment.Equipment_ID

  Room_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Rooms.Room_ID

  Quantity: number /* 32-bit integer */; // Has Default

  /**
   * Max length: 75 characters
   */
  Desired_Placement_or_Location?: string /* max 75 chars */ | null;

  _Approved?: boolean | null; // Read Only

  Cancelled: boolean; // Has Default

  /**
   * Max length: 2000 characters
   */
  Notes?: string /* max 2000 chars */ | null;
}

export type EventEquipmentRecord = EventEquipment;
