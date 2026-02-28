"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { SelectionService } from "@/services/selectionService";
import { SelectionResult } from "@/lib/dto/selections";

function getUserGuid(session: { user: Record<string, unknown> }): string {
  const guid = session.user.userGuid as string | undefined;
  if (!guid) {
    throw new Error("User GUID not found in session");
  }
  return guid;
}

import { MAX_SELECTION_RECORDS } from "./constants";

export interface CreateMpSelectionInput {
  selectionName: string;
  pageId: number;
  recordIds: number[];
}

export async function createMpSelection(
  input: CreateMpSelectionInput
): Promise<SelectionResult> {
  try {
    if (input.recordIds.length > MAX_SELECTION_RECORDS) {
      throw new Error(
        `Too many records: ${input.recordIds.length} exceeds the maximum of ${MAX_SELECTION_RECORDS}`
      );
    }
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    const userGuid = getUserGuid(session);

    const { MPHelper } = await import("@/lib/providers/ministry-platform");
    const mp = new MPHelper();

    const users = await mp.getTableRecords<{ User_ID: number }>({
      table: "dp_Users",
      filter: `User_GUID = '${userGuid}'`,
      select: "User_ID",
      top: 1,
    });

    if (!users || users.length === 0 || !users[0].User_ID) {
      throw new Error("Unable to determine user User_ID");
    }

    const userId = users[0].User_ID;

    const selectionService = await SelectionService.getInstance();
    return await selectionService.createSelection({ ...input, userId });
  } catch (error) {
    console.error("Error creating MP selection:", error);
    throw error instanceof Error ? error : new Error("Failed to create MP selection");
  }
}
