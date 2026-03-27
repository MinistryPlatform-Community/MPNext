import { MPHelper } from '@/lib/providers/ministry-platform';
import { PledgeCampaignCommitmentsSchema } from '@/lib/providers/ministry-platform/models/PledgeCampaignCommitmentsSchema';
import type { CommitmentImportRow, CommitmentImportResult, PledgeCampaignOption } from '@/lib/dto';
import { z } from 'zod';

// Relax DB-defaulted fields for inserts — keeps generated schema untouched
const CommitmentInsertSchema = PledgeCampaignCommitmentsSchema.extend({
  Pledge_Status_ID: PledgeCampaignCommitmentsSchema.shape.Pledge_Status_ID.optional(),
  Pledge_ID: PledgeCampaignCommitmentsSchema.shape.Pledge_ID.optional(),
});

const csvRowSchema = z.object({
  Contact_ID: z.number().int().min(0).optional(),
  First_Name: z.string().max(50).nullable().optional(),
  Last_Name: z.string().max(50).nullable().optional(),
  Spouse_First: z.string().max(50).nullable().optional(),
  Spouse_Last: z.string().max(50).nullable().optional(),
  Spouse_Phone: z.string().max(50).nullable().optional(),
  Spouse_Email_Address: z.string().max(254).nullable().optional(),
  Spouse_Birthday: z.string().nullable().optional(),
  Phone: z.string().max(50).nullable().optional(),
  Email_Address: z.string().max(254).nullable().optional(),
  Birthday: z.string().nullable().optional(),
  Commitment_Date: z.string().optional().default(''),
  Previous_Annual_Giving: z.number().min(0).optional().default(0),
  Expanded_Annual_Giving: z.number().min(0).optional().default(0),
  Kickoff_Giving: z.number().min(0).optional().default(0),
  Two_Year_Commitment: z.number().min(0).optional().default(0),
  Step_Fearless: z.boolean().optional().default(false),
  Step_Above_and_Beyond: z.boolean().optional().default(false),
  Step_Tithing: z.boolean().optional().default(false),
  Step_Percentage: z.boolean().optional().default(false),
  Step_Consistent: z.boolean().optional().default(false),
  Contact_Me: z.boolean().optional().default(false),
  Include_Spouse_Giving: z.boolean().optional().default(false),
});

function parseBoolean(value: string | undefined): boolean {
  if (!value) return false;
  const lower = value.trim().toLowerCase();
  return lower === 'true' || lower === '1' || lower === 'yes';
}

function parseNumber(value: string | undefined): number {
  if (!value || value.trim() === '') return 0;
  const num = Number(value.trim());
  return isNaN(num) ? 0 : num;
}

function parseOptionalString(value: string | undefined): string | null {
  if (!value || value.trim() === '') return null;
  return value.trim();
}

function toIsoDatetime(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  let date: Date;
  if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) {
    date = new Date(trimmed);
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    date = new Date(`${trimmed}T00:00:00.000Z`);
  } else {
    date = new Date(trimmed);
  }
  if (isNaN(date.getTime())) return null;
  return date.toISOString();
}

export class CommitmentImportService {
  private static instance: CommitmentImportService;
  private mp: MPHelper | null = null;

  private constructor() {
    this.initialize();
  }

  public static async getInstance(): Promise<CommitmentImportService> {
    if (!CommitmentImportService.instance) {
      CommitmentImportService.instance = new CommitmentImportService();
      await CommitmentImportService.instance.initialize();
    }
    return CommitmentImportService.instance;
  }

  private async initialize(): Promise<void> {
    this.mp = new MPHelper();
  }

  public async getDefaultContactId(): Promise<number> {
    const records = await this.mp!.getTableRecords<{ Value: string }>({
      table: 'dp_Configuration_Settings',
      filter: "Application_Code = 'COMMON' AND Key_Name = 'defaultContactID'",
      select: 'Value',
      top: 1,
    });

    if (records.length === 0) {
      throw new Error('Default Contact ID not found in dp_Configuration_Settings');
    }

    const id = Number(records[0].Value);
    if (isNaN(id) || id <= 0) {
      throw new Error(`Invalid default Contact ID: ${records[0].Value}`);
    }

    return id;
  }

  public async getPledgeCampaigns(): Promise<PledgeCampaignOption[]> {
    return this.mp!.getTableRecords<PledgeCampaignOption>({
      table: 'Pledge_Campaigns',
      select: 'Pledge_Campaign_ID,Campaign_Name',
      orderBy: 'Campaign_Name',
    });
  }

  public async getCampaignStartDate(campaignId: number): Promise<string> {
    const records = await this.mp!.getTableRecords<{ Start_Date: string }>({
      table: 'Pledge_Campaigns',
      filter: `Pledge_Campaign_ID = ${campaignId}`,
      select: 'Start_Date',
      top: 1,
    });
    if (records.length === 0) {
      throw new Error(`Pledge Campaign ${campaignId} not found`);
    }
    return records[0].Start_Date;
  }

  public async resolveUserId(userGuid: string): Promise<number | undefined> {
    const records = await this.mp!.getTableRecords<{ User_ID: number }>({
      table: 'dp_Users',
      filter: `User_GUID = '${userGuid}'`,
      select: 'User_ID',
      top: 1,
    });
    return records[0]?.User_ID;
  }

  public async validateContactId(contactId: number): Promise<boolean> {
    const records = await this.mp!.getTableRecords<{ Contact_ID: number }>({
      table: 'Contacts',
      filter: `Contact_ID = ${contactId}`,
      select: 'Contact_ID',
      top: 1,
    });
    return records.length > 0;
  }

  public async importCommitments(
    campaignId: number,
    rows: CommitmentImportRow[],
    defaultCommitmentDate: string,
    auditUserId?: number
  ): Promise<CommitmentImportResult> {
    const result: CommitmentImportResult = {
      total: rows.length,
      succeeded: 0,
      failed: [],
      warnings: [],
    };

    // Fetch campaign start date for commitment date validation
    const campaignStartDateRaw = await this.getCampaignStartDate(campaignId);
    const campaignStartDate = new Date(campaignStartDateRaw);
    const fallbackDateIso = toIsoDatetime(defaultCommitmentDate);
    if (!fallbackDateIso) {
      throw new Error(`Invalid default commitment date: "${defaultCommitmentDate}"`);
    }

    let defaultContactId: number | null = null;
    const recordsToInsert: Record<string, unknown>[] = [];
    const rowIndexMap: number[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;

      try {
        const parsed = {
          Contact_ID: parseNumber(row.Contact_ID),
          First_Name: parseOptionalString(row.First_Name),
          Last_Name: parseOptionalString(row.Last_Name),
          Spouse_First: parseOptionalString(row.Spouse_First),
          Spouse_Last: parseOptionalString(row.Spouse_Last),
          Spouse_Phone: parseOptionalString(row.Spouse_Phone),
          Spouse_Email_Address: parseOptionalString(row.Spouse_Email_Address),
          Spouse_Birthday: parseOptionalString(row.Spouse_Birthday),
          Phone: parseOptionalString(row.Phone),
          Email_Address: parseOptionalString(row.Email_Address),
          Birthday: parseOptionalString(row.Birthday),
          Commitment_Date: row.Commitment_Date?.trim() || defaultCommitmentDate,
          Previous_Annual_Giving: parseNumber(row.Previous_Annual_Giving),
          Expanded_Annual_Giving: parseNumber(row.Expanded_Annual_Giving),
          Kickoff_Giving: parseNumber(row.Kickoff_Giving),
          Two_Year_Commitment: parseNumber(row.Two_Year_Commitment),
          Step_Fearless: parseBoolean(row.Step_Fearless),
          Step_Above_and_Beyond: parseBoolean(row.Step_Above_and_Beyond),
          Step_Tithing: parseBoolean(row.Step_Tithing),
          Step_Percentage: parseBoolean(row.Step_Percentage),
          Step_Consistent: parseBoolean(row.Step_Consistent),
          Contact_Me: parseBoolean(row.Contact_Me),
          Include_Spouse_Giving: parseBoolean(row.Include_Spouse_Giving),
        };

        const validated = csvRowSchema.parse(parsed);

        // Resolve Contact_ID: use provided if valid, otherwise fall back to default
        let contactId = validated.Contact_ID ?? 0;
        if (contactId > 0) {
          const exists = await this.validateContactId(contactId);
          if (!exists) {
            contactId = 0; // fall through to default
          }
        }
        if (contactId <= 0) {
          if (defaultContactId === null) {
            defaultContactId = await this.getDefaultContactId();
          }
          contactId = defaultContactId;
        }

        // Check Two_Year_Commitment against calculated value if provided
        if (validated.Two_Year_Commitment > 0) {
          const expected = (validated.Previous_Annual_Giving + validated.Expanded_Annual_Giving) * 2;
          if (Math.abs(validated.Two_Year_Commitment - expected) > 0.01) {
            result.warnings.push({
              row: rowNum,
              message: `Two-year commitment $${validated.Two_Year_Commitment.toFixed(2)} doesn't match (Previous $${validated.Previous_Annual_Giving.toFixed(2)} + Expanded $${validated.Expanded_Annual_Giving.toFixed(2)}) × 2 = $${expected.toFixed(2)}`,
            });
          }
        }

        // Parse commitment date — fall back to default if malformed or before campaign start
        let commitmentDate = toIsoDatetime(validated.Commitment_Date);
        if (!commitmentDate || new Date(commitmentDate) < campaignStartDate) {
          commitmentDate = fallbackDateIso;
        }
        const birthday = validated.Birthday ? toIsoDatetime(validated.Birthday) : null;
        const spouseBirthday = validated.Spouse_Birthday ? toIsoDatetime(validated.Spouse_Birthday) : null;

        recordsToInsert.push({
          Commitment_ID: 0,
          Pledge_Campaign_ID: campaignId,
          Contact_ID: contactId,
          Commitment_Date: commitmentDate,
          First_Name: validated.First_Name ?? null,
          Last_Name: validated.Last_Name ?? null,
          Spouse_First: validated.Spouse_First ?? null,
          Spouse_Last: validated.Spouse_Last ?? null,
          Spouse_Phone: validated.Spouse_Phone ?? null,
          Spouse_Email_Address: validated.Spouse_Email_Address ?? null,
          Spouse_Birthday: spouseBirthday,
          Phone: validated.Phone ?? null,
          Email_Address: validated.Email_Address ?? null,
          Birthday: birthday,
          Previous_Annual_Giving: validated.Previous_Annual_Giving,
          Expanded_Annual_Giving: validated.Expanded_Annual_Giving,
          Kickoff_Giving: validated.Kickoff_Giving,
          Two_Year_Commitment: validated.Two_Year_Commitment,
          Step_Fearless: validated.Step_Fearless,
          Step_Above_and_Beyond: validated.Step_Above_and_Beyond,
          Step_Tithing: validated.Step_Tithing,
          Step_Percentage: validated.Step_Percentage,
          Step_Consistent: validated.Step_Consistent,
          Contact_Me: validated.Contact_Me,
          Include_Spouse_Giving: validated.Include_Spouse_Giving,
        });
        rowIndexMap.push(rowNum);
      } catch (error) {
        const message = error instanceof z.ZodError
          ? error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')
          : error instanceof Error ? error.message : 'Unknown error';
        result.failed.push({ row: rowNum, reason: message });
      }
    }

    // Batch insert valid records
    if (recordsToInsert.length > 0) {
      try {
        await this.mp!.createTableRecords('Pledge_Campaign_Commitments', recordsToInsert, {
          schema: CommitmentInsertSchema,
          ...(auditUserId ? { $userId: auditUserId } : {}),
        });
        result.succeeded = recordsToInsert.length;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown insert error';
        for (const rowNum of rowIndexMap) {
          result.failed.push({ row: rowNum, reason: message });
        }
      }
    }

    return result;
  }
}
