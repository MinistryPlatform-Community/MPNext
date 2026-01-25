/**
 * Interface for Group_Attributes
* Table: Group_Attributes
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface GroupAttributes {

  Group_Attribute_ID: number /* 32-bit integer */; // Primary Key

  Attribute_ID: number /* 32-bit integer */; // Foreign Key -> Attributes.Attribute_ID

  Group_ID: number /* 32-bit integer */; // Foreign Key -> Groups.Group_ID

  Start_Date: string /* ISO datetime */;

  End_Date?: string /* ISO datetime */ | null;

  /**
   * Max length: 255 characters
   */
  Notes?: string /* max 255 chars */ | null;
}

export type GroupAttributesRecord = GroupAttributes;
