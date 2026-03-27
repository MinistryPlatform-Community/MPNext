'use server';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { CommitmentImportService } from '@/services/commitmentImportService';
import type { CommitmentImportRow, CommitmentImportResult, PledgeCampaignOption } from '@/lib/dto';

export async function getPledgeCampaigns(): Promise<PledgeCampaignOption[]> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    throw new Error('Authentication required');
  }
  const service = await CommitmentImportService.getInstance();
  return service.getPledgeCampaigns();
}

export async function importCommitments(
  campaignId: number,
  rows: CommitmentImportRow[],
  defaultCommitmentDate: string
): Promise<CommitmentImportResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    throw new Error('Authentication required');
  }

  const service = await CommitmentImportService.getInstance();

  // Resolve logged-in user's Contact_ID for MP audit logging
  let auditUserId: number | undefined;
  const userGuid = (session.user as { userGuid?: string }).userGuid;
  if (userGuid) {
    auditUserId = await service.resolveUserId(userGuid);
  }

  return service.importCommitments(campaignId, rows, defaultCommitmentDate, auditUserId);
}
