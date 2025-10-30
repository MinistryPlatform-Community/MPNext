/**
 * Interface for Form_Fields
* Table: Form_Fields
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface FormFields {

  Form_Field_ID: number /* 32-bit integer */; // Primary Key

  Field_Order: number /* 16-bit integer */;

  /**
   * Max length: 128 characters
   */
  Field_Label: string /* max 128 chars */;

  Field_Type_ID: number /* 32-bit integer */; // Foreign Key -> Form_Field_Types.Form_Field_Type_ID

  /**
   * Max length: 4000 characters
   */
  Field_Values?: string /* max 4000 chars */ | null;

  Required: boolean;

  Form_ID: number /* 32-bit integer */; // Foreign Key -> Forms.Form_ID

  Placement_Required: boolean; // Has Default

  /**
   * Max length: 2147483647 characters
   */
  Alternate_Label?: string /* max 2147483647 chars */ | null;

  Is_Hidden: boolean; // Has Default

  Depends_On?: number /* 32-bit integer */ | null; // Foreign Key -> Form_Fields.Form_Field_ID

  /**
   * Max length: 255 characters
   */
  Depends_On_Value?: string /* max 255 chars */ | null;
}

export type FormFieldsRecord = FormFields;
