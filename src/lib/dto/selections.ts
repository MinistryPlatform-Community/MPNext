export interface SelectionResult {
  pageId: number;
  selectionId: number;
  selectionUrl: string;
}

export interface CreateSelectionInput {
  selectionName: string;
  pageId: number;
  recordIds: number[];
  userId: number;
}

export interface MpPage {
  Page_ID: number;
  Display_Name: string;
}
