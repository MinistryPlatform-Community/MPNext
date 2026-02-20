"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ToolService } from "@/services/toolService";
import { MPHelper } from "@/lib/providers/ministry-platform";
import { MPUserProfile } from "@/lib/providers/ministry-platform/types";

export async function getUserTools(): Promise<string[]> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    throw new Error("Unauthorized - Missing user session data");
  }

  const userGuid = (session.user as Record<string, unknown>).userGuid as string | undefined;
  if (!userGuid) {
    throw new Error("User GUID not found in session");
  }

  const mp = new MPHelper();
  const records = await mp.getTableRecords<MPUserProfile>({
    table: "dp_Users",
    filter: `User_GUID = '${userGuid}'`,
    select: "User_ID",
    top: 1
  });

  if (!records || records.length === 0) {
    throw new Error("User not found");
  }

  const userId = records[0].User_ID;

  const toolService = await ToolService.getInstance();
  const toolPaths = await toolService.getUserTools(1, userId);

  return toolPaths;
}
