"use server";

import { ContactLog } from "@/lib/providers/ministry-platform/models/ContactLog";
import { ContactLogTypes } from "@/lib/providers/ministry-platform/models/ContactLogTypes";
import { ContactLogInput } from "@/lib/providers/ministry-platform/models/ContactLogSchema";
import { ContactLogService } from "@/services/contactLogService";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/** Extract the MP User_GUID from a Better Auth session */
function getUserGuid(session: { user: Record<string, unknown> }): string {
  const guid = session.user.userGuid as string | undefined;
  if (!guid) {
    throw new Error("User GUID not found in session");
  }
  return guid;
}

export async function getContactLogTypes(): Promise<ContactLogTypes[]> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    const contactLogService = await ContactLogService.getInstance();
    const types = await contactLogService.getContactLogTypes();

    return types;
  } catch (error) {
    console.error("Error fetching contact log types:", error);
    throw error instanceof Error ? error : new Error("Failed to fetch contact log types");
  }
}

export async function createContactLog(
  contactLogData: Omit<ContactLogInput, "Contact_Log_ID" | "Made_By">
): Promise<ContactLog> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    const userGuid = getUserGuid(session);

    // Fetch User_ID from MP using User_GUID
    const { MPHelper } = await import("@/lib/providers/ministry-platform");
    const mp = new MPHelper();

    const users = await mp.getTableRecords<{ User_ID: number }>({
      table: "dp_Users",
      filter: `User_GUID = '${userGuid}'`,
      select: "User_ID",
      top: 1
    });

    if (!users || users.length === 0 || !users[0].User_ID) {
      throw new Error("Unable to determine user User_ID");
    }

    const userId = users[0].User_ID;

    if (!contactLogData.Contact_ID || !contactLogData.Contact_Date || !contactLogData.Notes) {
      throw new Error("Required fields are missing: Contact_ID, Contact_Date, and Notes are required");
    }

    // Add Made_By from session (User_ID of logged-in user)
    const logDataWithUser = {
      ...contactLogData,
      Made_By: userId,
    };

    console.log("createContactLog action - Creating with data:", JSON.stringify(logDataWithUser, null, 2));

    const contactLogService = await ContactLogService.getInstance();
    const contactLog = await contactLogService.createContactLog(logDataWithUser);

    console.log("createContactLog action - Successfully created");
    return contactLog;
  } catch (error) {
    console.error("Error creating contact log:", error);
    throw error instanceof Error ? error : new Error("Failed to create contact log");
  }
}

export async function updateContactLog(
  contactLogId: number,
  contactLogData: Partial<Omit<ContactLogInput, "Contact_Log_ID" | "Made_By">>
): Promise<ContactLog> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    const userGuid = getUserGuid(session);

    // Fetch User_ID from MP using User_GUID
    const { MPHelper } = await import("@/lib/providers/ministry-platform");
    const mp = new MPHelper();

    const users = await mp.getTableRecords<{ User_ID: number }>({
      table: "dp_Users",
      filter: `User_GUID = '${userGuid}'`,
      select: "User_ID",
      top: 1
    });

    if (!users || users.length === 0 || !users[0].User_ID) {
      throw new Error("Unable to determine user User_ID");
    }

    const userId = users[0].User_ID;

    if (!contactLogId || contactLogId <= 0) {
      throw new Error("Valid Contact Log ID is required");
    }

    // Add Made_By from session (User_ID of logged-in user)
    const logDataWithUser = {
      ...contactLogData,
      Made_By: userId,
    };

    console.log("updateContactLog action - Updating log:", contactLogId);
    console.log("updateContactLog action - Update data:", JSON.stringify(logDataWithUser, null, 2));

    const contactLogService = await ContactLogService.getInstance();
    const contactLog = await contactLogService.updateContactLog(contactLogId, logDataWithUser);

    console.log("updateContactLog action - Successfully updated");
    return contactLog;
  } catch (error) {
    console.error("Error updating contact log:", error);
    throw error instanceof Error ? error : new Error("Failed to update contact log");
  }
}

export async function deleteContactLog(contactLogId: number): Promise<void> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    if (!contactLogId || contactLogId <= 0) {
      throw new Error("Valid Contact Log ID is required");
    }

    console.log("deleteContactLog action - Deleting log:", contactLogId);

    const contactLogService = await ContactLogService.getInstance();
    await contactLogService.deleteContactLog(contactLogId);

    console.log("deleteContactLog action - Successfully deleted");
  } catch (error) {
    console.error("Error deleting contact log:", error);
    throw error instanceof Error ? error : new Error("Failed to delete contact log");
  }
}

export async function getContactLogsByContactId(contactId: number): Promise<ContactLog[]> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    if (!contactId || contactId <= 0) {
      throw new Error("Valid contact ID is required");
    }

    const contactLogService = await ContactLogService.getInstance();
    const results = await contactLogService.getContactLogsByContactId(contactId);

    return results;
  } catch (error) {
    console.error("Error fetching contact logs by contact ID:", error);
    throw error instanceof Error ? error : new Error("Failed to fetch contact logs");
  }
}

export async function getContactLogById(contactLogId: number): Promise<ContactLog | null> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    if (!contactLogId || contactLogId <= 0) {
      throw new Error("Valid contact log ID is required");
    }

    const contactLogService = await ContactLogService.getInstance();
    const result = await contactLogService.getContactLogById(contactLogId);

    return result;
  } catch (error) {
    console.error("Error fetching contact log by ID:", error);
    throw error instanceof Error ? error : new Error("Failed to fetch contact log");
  }
}
