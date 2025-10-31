import { ContactsRecord, MPHelper } from "@/lib/providers/ministry-platform";

export class DonorService {
  private static instance: DonorService;
  private mp: MPHelper | null = null;

  private constructor() {
    this.initialize();
  }

  public static async getInstance(): Promise<DonorService> {
    if (!DonorService.instance) {
      DonorService.instance = new DonorService();
      await DonorService.instance.initialize();
    }
    return DonorService.instance;
  }

  private async initialize(): Promise<void> {
    this.mp = new MPHelper();
  }

  public async findDonor(
    firstName: string,
    lastName: string,
    email: string
  ): Promise<ContactsRecord | null> {
    const records = await this.mp!.getTableRecords<ContactsRecord>({
      table: "Contacts",
      filter: `(First_Name = '${firstName}' OR Nickname = '${firstName}') AND Last_Name = '${lastName}' AND Email_Address = '${email}'`,
    });

    return records.length === 1 ? records[0] : null;
  }
}
