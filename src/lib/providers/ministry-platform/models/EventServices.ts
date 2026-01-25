/**
 * Interface for Event_Services
* Table: Event_Services
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface EventServices {

  Event_Service_ID: number /* 32-bit integer */; // Primary Key

  Event_ID: number /* 32-bit integer */; // Foreign Key -> Events.Event_ID

  Service_ID: number /* 32-bit integer */; // Foreign Key -> Servicing.Service_ID

  Quantity?: number /* 32-bit integer */ | null;

  /**
   * Max length: 50 characters
   */
  Location_For_Service?: string /* max 50 chars */ | null;

  /**
   * Max length: 2000 characters
   */
  Notes?: string /* max 2000 chars */ | null;

  Cancelled: boolean; // Has Default

  _Approved?: boolean | null; // Read Only
}

export type EventServicesRecord = EventServices;
