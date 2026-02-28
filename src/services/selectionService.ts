import { MPHelper } from "@/lib/providers/ministry-platform";
import { CreateSelectionInput, MpPage, SelectionResult } from "@/lib/dto/selections";

const CREATE_SELECTION_PROC = "api_custom_CreateSelection";
const GET_PAGES_PROC = "api_custom_GetPages";

interface ProcSelectionResult {
  Selection_ID: number;
  Selection_Name: string;
  Record_Count: number;
}

export class SelectionService {
  private static instance: SelectionService;
  private mp: MPHelper | null = null;

  private constructor() {
    this.initialize();
  }

  public static async getInstance(): Promise<SelectionService> {
    if (!SelectionService.instance) {
      SelectionService.instance = new SelectionService();
      await SelectionService.instance.initialize();
    }
    return SelectionService.instance;
  }

  private async initialize(): Promise<void> {
    this.mp = new MPHelper();
  }

  public async getPages(searchName?: string): Promise<MpPage[]> {
    const params: Record<string, unknown> = {};
    if (searchName) {
      params["@SearchName"] = searchName;
    }
    const resultSets = await this.mp!.executeProcedureWithBody(GET_PAGES_PROC, params);
    const rows = (resultSets?.[0] ?? []) as MpPage[];
    return rows;
  }

  public async createSelection(input: CreateSelectionInput): Promise<SelectionResult> {
    const { selectionName, pageId, recordIds, userId } = input;

    if (!recordIds || recordIds.length === 0) {
      throw new Error("recordIds must not be empty");
    }

    const domainId = Number(process.env.MINISTRY_PLATFORM_DOMAIN_ID ?? "1");

    const resultSets = await this.mp!.executeProcedureWithBody(CREATE_SELECTION_PROC, {
      "@DomainID": domainId,
      "@PageID": pageId,
      "@UserID": userId,
      "@SelectionName": selectionName,
      "@RecordIDs": recordIds.join(","),
    });

    // executeProcedureWithBody returns unknown[][] — outer array = result sets, inner = rows
    const firstRow = (resultSets?.[0]?.[0] ?? null) as ProcSelectionResult | null;

    if (!firstRow?.Selection_ID) {
      throw new Error("Failed to create selection: stored procedure returned no Selection_ID");
    }

    const selectionId = firstRow.Selection_ID;
    const mpUrl = process.env.NEXT_PUBLIC_MINISTRY_PLATFORM_URL;
    const selectionUrl = `${mpUrl}/${pageId}.${selectionId}`;

    return { pageId, selectionId, selectionUrl };
  }
}
