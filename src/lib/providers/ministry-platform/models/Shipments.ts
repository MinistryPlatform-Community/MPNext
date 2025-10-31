/**
 * Interface for Shipments
* Table: Shipments
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport
 * Generated from column metadata
 */
export interface Shipments {

  Shipment_ID: number /* 32-bit integer */; // Primary Key

  Shipment_Date: string /* ISO datetime */;

  Event_ID: number /* 32-bit integer */; // Foreign Key -> Events.Event_ID

  /**
   * Max length: 2147483647 characters
   */
  Shared_Packing_List?: string /* max 2147483647 chars */ | null;

  Subscription_Closed: boolean; // Has Default
}

export type ShipmentsRecord = Shipments;
