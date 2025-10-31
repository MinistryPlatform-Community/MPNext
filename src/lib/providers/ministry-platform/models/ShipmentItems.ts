/**
 * Interface for Shipment_Items
* Table: Shipment_Items
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: DataExport
 * Generated from column metadata
 */
export interface ShipmentItems {

  Shipment_Item_ID: number /* 32-bit integer */; // Primary Key

  Shipment_ID: number /* 32-bit integer */; // Foreign Key -> Shipments.Shipment_ID

  /**
   * Max length: 100 characters
   */
  Item_Description: string /* max 100 chars */;

  Product_Option_Price_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Product_Option_Prices.Product_Option_Price_ID

  Item_Sort: number /* 32-bit integer */; // Has Default

  Item_Qty: number /* 32-bit integer */; // Has Default

  Qty_Is_Per_Box: boolean; // Has Default
}

export type ShipmentItemsRecord = ShipmentItems;
