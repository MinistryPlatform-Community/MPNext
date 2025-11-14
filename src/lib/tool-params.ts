import { ToolService } from "@/services/toolService";

export interface PageData {
  Page_ID: number;
  Display_Name: string;
  Singular_Name: string;
  Table_Name: string;
  Primary_Key: string;
  Selected_Record_Expression?: string;
  Start_Date_Field?: string;
  End_Date_Field?: string;
  Contact_ID_Field?: string;
  Filter_Clause?: string;
  Global_Filter_ID_Field?: string;
}

export interface ToolParams {
  pageID?: number;
  s?: number;
  sc?: number;
  p?: number;
  q?: string;
  v?: number;
  recordID?: number;
  recordDescription?: string;
  addl?: string;
  pageData?: PageData;
}

export async function parseToolParams(searchParams: URLSearchParams | { [key: string]: string | string[] | undefined }): Promise<ToolParams> {
  const getValue = (key: string): string | undefined => {
    if (searchParams instanceof URLSearchParams) {
      return searchParams.get(key) || undefined;
    }
    const value = searchParams[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const pageID = getValue('pageID');
  const s = getValue('s');
  const sc = getValue('sc');
  const p = getValue('p');
  const q = getValue('q');
  const v = getValue('v');
  const recordID = getValue('recordID');
  const recordDescription = getValue('recordDescription');
  const addl = getValue('addl');

  const parsedPageID = pageID ? parseInt(pageID, 10) : undefined;
  
  // Fetch page data if pageID is provided
  let pageData: PageData | undefined;
  if (parsedPageID) {
    try {
      const toolService = await ToolService.getInstance();
      pageData = await toolService.getPageData(parsedPageID) || undefined;
    } catch {
      console.warn('Could not fetch page data for pageID:', parsedPageID, '- Stored procedure may not exist yet');
      pageData = undefined;
    }
  }

  return {
    pageID: parsedPageID,
    s: s ? parseInt(s, 10) : undefined,
    sc: sc ? parseInt(sc, 10) : undefined,
    p: p ? parseInt(p, 10) : undefined,
    q: q || undefined,
    v: v ? parseInt(v, 10) : undefined,
    recordID: recordID ? parseInt(recordID, 10) : undefined,
    recordDescription: recordDescription ? decodeURIComponent(recordDescription) : undefined,
    addl: addl || undefined,
    pageData: pageData,
  };
}

export function isNewRecord(params: ToolParams): boolean {
  return params.recordID === -1 || params.recordID === undefined;
}

export function isEditMode(params: ToolParams): boolean {
  return !isNewRecord(params);
}
