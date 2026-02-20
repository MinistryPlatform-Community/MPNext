"use server";

import { auth } from "@/auth";
import { VolunteerService } from "@/services/volunteerService";
import { VolunteerCard, VolunteerDetail, MilestoneFileInfo, ApprovedVolunteersResult, GroupRoleOption, GroupFilterOption } from "@/lib/dto";

export async function getInProcessVolunteers(): Promise<VolunteerCard[]> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    const service = await VolunteerService.getInstance(session.accessToken);
    return await service.getInProcessVolunteers();
  } catch (error) {
    console.error("Error fetching in-process volunteers:", error);
    throw new Error("Failed to fetch in-process volunteers");
  }
}

export async function getApprovedVolunteers(): Promise<ApprovedVolunteersResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    const service = await VolunteerService.getInstance(session.accessToken);
    return await service.getApprovedVolunteers();
  } catch (error) {
    console.error("Error fetching approved volunteers:", error);
    throw new Error("Failed to fetch approved volunteers");
  }
}

export async function getVolunteerDetail(
  contactId: number,
  participantId: number,
  groupParticipantId: number
): Promise<VolunteerDetail | null> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    const service = await VolunteerService.getInstance(session.accessToken);
    return await service.getVolunteerDetail(contactId, participantId, groupParticipantId);
  } catch (error) {
    console.error("Error fetching volunteer detail:", error);
    throw new Error("Failed to fetch volunteer detail");
  }
}

export async function getMilestoneFiles(milestoneRecordId: number): Promise<MilestoneFileInfo[]> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    const service = await VolunteerService.getInstance(session.accessToken);
    return await service.getMilestoneFiles(milestoneRecordId);
  } catch (error) {
    console.error("Error fetching milestone files:", error);
    throw new Error("Failed to fetch milestone files");
  }
}

export async function getCertificationFiles(certificationRecordId: number): Promise<MilestoneFileInfo[]> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    const service = await VolunteerService.getInstance(session.accessToken);
    return await service.getCertificationFiles(certificationRecordId);
  } catch (error) {
    console.error("Error fetching certification files:", error);
    throw new Error("Failed to fetch certification files");
  }
}

export async function getFormResponseFiles(formResponseId: number): Promise<MilestoneFileInfo[]> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    const service = await VolunteerService.getInstance(session.accessToken);
    return await service.getFormResponseFiles(formResponseId);
  } catch (error) {
    console.error("Error fetching form response files:", error);
    throw new Error("Failed to fetch form response files");
  }
}

export async function createFormResponse(formData: FormData): Promise<void> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    let userId: number | undefined;
    if (session?.userProfile?.User_ID) {
      userId = session.userProfile.User_ID;
    }

    const service = await VolunteerService.getInstance(session.accessToken);
    const newFormResponseId = await service.createFormResponse({
      Form_ID: Number(formData.get("Form_ID")),
      Contact_ID: Number(formData.get("Contact_ID")),
      Response_Date: formData.get("Response_Date") as string || undefined,
    }, userId);

    // If files were included, attach them to the newly created form response
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key === "files" && value instanceof File && value.size > 0) {
        files.push(value);
      }
    }

    if (files.length > 0) {
      await service.uploadDocument('Form_Responses', newFormResponseId, files, userId);
    }
  } catch (error) {
    console.error("Error creating form response:", error);
    throw new Error("Failed to create form response");
  }
}

export async function uploadVolunteerPhoto(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const contactId = Number(formData.get("Contact_ID"));
    if (!contactId || isNaN(contactId)) {
      return { success: false, error: "Invalid Contact_ID" };
    }

    const file = formData.get("photo");
    if (!(file instanceof File) || file.size === 0) {
      return { success: false, error: "No file provided" };
    }

    const MAX_FILE_SIZE = 1 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return { success: false, error: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum 1 MB.` };
    }

    let userId: number | undefined;
    if (session?.userProfile?.User_ID) {
      userId = session.userProfile.User_ID;
    }

    const service = await VolunteerService.getInstance(session.accessToken);
    await service.uploadContactPhoto(contactId, file, userId);
    return { success: true };
  } catch (error) {
    console.error("Error uploading volunteer photo:", error);
    return { success: false, error: "Failed to upload photo" };
  }
}

export async function createVolunteerMilestone(formData: FormData): Promise<void> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    let userId: number | undefined;
    if (session?.userProfile?.User_ID) {
      userId = session.userProfile.User_ID;
    }

    const service = await VolunteerService.getInstance(session.accessToken);
    const newMilestoneId = await service.createMilestone({
      Participant_ID: Number(formData.get("Participant_ID")),
      Milestone_ID: Number(formData.get("Milestone_ID")),
      Program_ID: Number(formData.get("Program_ID")),
      Date_Accomplished: formData.get("Date_Accomplished") as string || undefined,
      Notes: formData.get("Notes") as string || undefined,
    }, userId);

    // If files were included, attach them to the newly created milestone
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key === "files" && value instanceof File && value.size > 0) {
        files.push(value);
      }
    }

    if (files.length > 0) {
      await service.uploadDocument('Participant_Milestones', newMilestoneId, files, userId);
    }
  } catch (error) {
    console.error("Error creating volunteer milestone:", error);
    throw new Error("Failed to create milestone");
  }
}

export async function updateVolunteerMilestone(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const milestoneRecordId = Number(formData.get("Participant_Milestone_ID"));
    if (!milestoneRecordId || isNaN(milestoneRecordId)) {
      return { success: false, error: "Invalid milestone record ID" };
    }

    let userId: number | undefined;
    if (session?.userProfile?.User_ID) {
      userId = session.userProfile.User_ID;
    }

    const service = await VolunteerService.getInstance(session.accessToken);
    await service.updateMilestone({
      Participant_Milestone_ID: milestoneRecordId,
      Date_Accomplished: formData.get("Date_Accomplished") as string || undefined,
      Notes: formData.get("Notes") as string || undefined,
    }, userId);

    // If files were included, attach them to the milestone
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key === "files" && value instanceof File && value.size > 0) {
        files.push(value);
      }
    }

    if (files.length > 0) {
      await service.uploadDocument('Participant_Milestones', milestoneRecordId, files, userId);
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating volunteer milestone:", error);
    return { success: false, error: "Failed to update milestone" };
  }
}

export async function updateVolunteerCertification(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const certId = Number(formData.get("Participant_Certification_ID"));
    if (!certId || isNaN(certId)) {
      return { success: false, error: "Invalid certification record ID" };
    }

    let userId: number | undefined;
    if (session?.userProfile?.User_ID) {
      userId = session.userProfile.User_ID;
    }

    const service = await VolunteerService.getInstance(session.accessToken);
    await service.updateCertification({
      Participant_Certification_ID: certId,
      Certification_Completed: formData.get("Certification_Completed") as string || undefined,
      Notes: formData.get("Notes") as string || undefined,
    }, userId);

    // If files were included, attach them to the certification
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key === "files" && value instanceof File && value.size > 0) {
        files.push(value);
      }
    }

    if (files.length > 0) {
      await service.uploadDocument('Participant_Certifications', certId, files, userId);
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating volunteer certification:", error);
    return { success: false, error: "Failed to update certification" };
  }
}

export async function updateVolunteerFormResponse(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const frId = Number(formData.get("Form_Response_ID"));
    if (!frId || isNaN(frId)) {
      return { success: false, error: "Invalid form response record ID" };
    }

    let userId: number | undefined;
    if (session?.userProfile?.User_ID) {
      userId = session.userProfile.User_ID;
    }

    const service = await VolunteerService.getInstance(session.accessToken);
    await service.updateFormResponse({
      Form_Response_ID: frId,
      Response_Date: formData.get("Response_Date") as string || undefined,
    }, userId);

    // If files were included, attach them to the form response
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key === "files" && value instanceof File && value.size > 0) {
        files.push(value);
      }
    }

    if (files.length > 0) {
      await service.uploadDocument('Form_Responses', frId, files, userId);
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating form response:", error);
    return { success: false, error: "Failed to update form response" };
  }
}

export async function getApprovedGroupRoles(): Promise<GroupRoleOption[]> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    const service = await VolunteerService.getInstance(session.accessToken);
    return await service.getApprovedGroupRoles();
  } catch (error) {
    console.error("Error fetching approved group roles:", error);
    throw new Error("Failed to fetch group roles");
  }
}

export async function getApprovedGroupsList(): Promise<GroupFilterOption[]> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    const service = await VolunteerService.getInstance(session.accessToken);
    return await service.getApprovedGroupsList();
  } catch (error) {
    console.error("Error fetching approved groups list:", error);
    throw new Error("Failed to fetch approved groups");
  }
}

export async function assignVolunteerToGroup(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const currentGroupParticipantId = Number(formData.get("currentGroupParticipantId"));
    const participantId = Number(formData.get("participantId"));
    const targetGroupId = Number(formData.get("targetGroupId"));
    const targetRoleId = Number(formData.get("targetRoleId"));

    if (!currentGroupParticipantId || !participantId || !targetGroupId || !targetRoleId) {
      return { success: false, error: "Missing required fields" };
    }

    let userId: number | undefined;
    if (session?.userProfile?.User_ID) {
      userId = session.userProfile.User_ID;
    }

    const service = await VolunteerService.getInstance(session.accessToken);
    await service.assignVolunteerToGroup({
      currentGroupParticipantId,
      participantId,
      targetGroupId,
      targetRoleId,
      userId,
    });

    return { success: true };
  } catch (error) {
    console.error("Error assigning volunteer to group:", error);
    return { success: false, error: "Failed to assign volunteer to group" };
  }
}
