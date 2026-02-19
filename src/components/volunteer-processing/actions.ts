"use server";

import { auth } from "@/auth";
import { VolunteerService } from "@/services/volunteerService";
import { VolunteerCard, VolunteerDetail, MilestoneFileInfo, ApprovedVolunteersResult } from "@/lib/dto";

export async function getInProcessVolunteers(): Promise<VolunteerCard[]> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    const service = await VolunteerService.getInstance();
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

    const service = await VolunteerService.getInstance();
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

    const service = await VolunteerService.getInstance();
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

    const service = await VolunteerService.getInstance();
    return await service.getMilestoneFiles(milestoneRecordId);
  } catch (error) {
    console.error("Error fetching milestone files:", error);
    throw new Error("Failed to fetch milestone files");
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

    const service = await VolunteerService.getInstance();
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
