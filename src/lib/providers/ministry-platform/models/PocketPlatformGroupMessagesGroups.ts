/**
 * Interface for Pocket_Platform_Group_Messages_Groups
* Table: Pocket_Platform_Group_Messages_Groups
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: None
 * Generated from column metadata
 */
export interface PocketPlatformGroupMessagesGroups {

  Messaging_Group_ID: number /* 32-bit integer */; // Primary Key

  Group_ID: number /* 32-bit integer */; // Foreign Key -> Groups.Group_ID

  Last_Message_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Pocket_Platform_Group_Messages.Group_Message_ID

  Group_Enabled: boolean; // Has Default

  Last_Message_Date?: string /* ISO datetime */ | null;
}

export type PocketPlatformGroupMessagesGroupsRecord = PocketPlatformGroupMessagesGroups;
