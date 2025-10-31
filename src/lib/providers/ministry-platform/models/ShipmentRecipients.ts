/**
 * Interface for Shipment_Recipients
* Table: Shipment_Recipients
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport
 * Generated from column metadata
 */
export interface ShipmentRecipients {

  Recipient_ID: number /* 32-bit integer */; // Primary Key

  Subscriber_ID: number /* 32-bit integer */; // Foreign Key -> Shipment_Subscribers.Subscriber_ID

  Recipient_Contact?: number /* 32-bit integer */ | null; // Foreign Key -> Contacts.Contact_ID

  /**
   * Max length: 125 characters
   */
  Recipient_Name?: string /* max 125 chars */ | null;

  Product_Option_Price_ID: number /* 32-bit integer */; // Foreign Key -> Product_Option_Prices.Product_Option_Price_ID

  Cancel_Recipient: boolean; // Has Default
}

export type ShipmentRecipientsRecord = ShipmentRecipients;
