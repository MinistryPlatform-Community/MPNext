"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { MPHelper } from "@/lib/providers/ministry-platform";
import { SelectionService } from "@/services/selectionService";
import { MpPage } from "@/lib/dto/selections";

export interface DemoContact {
  contactId: number;
  name: string;
  email: string;
  householdId: number | null;
  participantId: number | null;
  donorId: number | null;
}

export async function getMpPages(searchName?: string): Promise<MpPage[]> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    throw new Error("Authentication required");
  }

  const selectionService = await SelectionService.getInstance();
  return await selectionService.getPages(searchName);
}

export async function getDemoContacts(): Promise<DemoContact[]> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    throw new Error("Authentication required");
  }

  const mp = new MPHelper();
  const records = await mp.getTableRecords<{
    Contact_ID: number;
    First_Name: string;
    Last_Name: string;
    Email_Address: string | null;
    Household_ID: number | null;
    Participant_Record: number | null;
    Donor_Record: number | null;
  }>({
    table: "Contacts",
    select:
      "Contact_ID, First_Name, Last_Name, Email_Address, Household_ID, Participant_Record, Donor_Record",
    top: 20,
  });

  return records.map((r) => ({
    contactId: r.Contact_ID,
    name: `${r.First_Name} ${r.Last_Name}`.trim(),
    email: r.Email_Address ?? "",
    householdId: r.Household_ID ?? null,
    participantId: r.Participant_Record ?? null,
    donorId: r.Donor_Record ?? null,
  }));
}
