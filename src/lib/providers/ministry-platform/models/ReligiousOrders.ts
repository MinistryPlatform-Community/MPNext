/**
 * Interface for Religious_Orders
* Table: Religious_Orders
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface ReligiousOrders {

  Religious_Order_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Religious_Order?: string /* max 50 chars */ | null;
}

export type ReligiousOrdersRecord = ReligiousOrders;
