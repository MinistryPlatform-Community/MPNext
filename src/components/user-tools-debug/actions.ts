"use server";

import { auth } from "@/auth";
import { ToolService } from "@/services/toolService";
import { MPHelper } from "@/lib/providers/ministry-platform";
import { MPUserProfile } from "@/lib/providers/ministry-platform/types";

export async function getUserTools(): Promise<string[]> {
  const session = await auth();
  
  if (!session?.userProfile?.User_GUID) {
    throw new Error("Unauthorized - Missing user session data");
  }

  let userId = session.userProfile.User_ID;
  
  if (!userId) {
    const mp = new MPHelper();
    const records = await mp.getTableRecords<MPUserProfile>({
      table: "dp_Users",
      filter: `User_GUID = '${session.userProfile.User_GUID}'`,
      select: "User_ID",
      top: 1
    });
    
    if (!records || records.length === 0) {
      throw new Error("User not found");
    }
    
    userId = records[0].User_ID;
  }

  const toolService = await ToolService.getInstance();
  const toolPaths = await toolService.getUserTools(1, userId);

  return toolPaths;
}
