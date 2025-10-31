/**
 * Interface for Shipment_Subscribers
* Table: Shipment_Subscribers
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport
 * Generated from column metadata
 */
export interface ShipmentSubscribers {

  Subscriber_ID: number /* 32-bit integer */; // Primary Key

  Shipment_ID: number /* 32-bit integer */; // Foreign Key -> Shipments.Shipment_ID

  Subscriber_Contact: number /* 32-bit integer */; // Foreign Key -> Contacts.Contact_ID

  Event_Participant_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Event_Participants.Event_Participant_ID

  /**
   * Max length: 500 characters
   */
  Shipping_Address?: string /* max 500 chars */ | null;

  Will_Pickup: boolean; // Has Default

  Cancel_Subscription: boolean; // Has Default

  Complete: boolean; // Has Default
}

export type ShipmentSubscribersRecord = ShipmentSubscribers;
