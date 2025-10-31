import { Pledges } from "@/lib/providers/ministry-platform/models/Pledges";
import { PledgesInput } from "@/lib/providers/ministry-platform/models/PledgesSchema";
import { MPHelper } from "@/lib/providers/ministry-platform";

export class PledgeService {
  private static instance: PledgeService;
  private mp: MPHelper | null = null;

  private constructor() {
    this.initialize();
  }

  public static async getInstance(): Promise<PledgeService> {
    if (!PledgeService.instance) {
      PledgeService.instance = new PledgeService();
      await PledgeService.instance.initialize();
    }
    return PledgeService.instance;
  }

  private async initialize(): Promise<void> {
    this.mp = new MPHelper();
  }

  public async createPledge(pledgeInput: Partial<PledgesInput>): Promise<Pledges> {
    const records = await this.mp!.createTableRecords(
      "Pledges",
      [pledgeInput as Record<string, unknown>]
    );

    if (!records || records.length === 0) {
      throw new Error("Failed to create pledge record");
    }

    return records[0] as unknown as Pledges;
  }
}
