/**
 * Interface for Payment_Detail
* Table: Payment_Detail
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface PaymentDetail {

  Payment_Detail_ID: number /* 32-bit integer */; // Primary Key

  Payment_ID: number /* 32-bit integer */; // Foreign Key -> Payments.Payment_ID

  Payment_Amount: number /* currency amount */;

  Invoice_Detail_ID: number /* 32-bit integer */; // Foreign Key -> Invoice_Detail.Invoice_Detail_ID
}

export type PaymentDetailRecord = PaymentDetail;
