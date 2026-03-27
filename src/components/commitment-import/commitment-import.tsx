'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, CheckCircle2, AlertCircle, AlertTriangle, Upload, Download, FileSpreadsheet, Pencil } from 'lucide-react';
import { getPledgeCampaigns, importCommitments } from './actions';
import type { PledgeCampaignOption, CommitmentImportRow, CommitmentImportResult } from '@/lib/dto';

const EXAMPLE_CSV = `First_Name,Last_Name,Phone,Email_Address,Birthday,Spouse_First,Spouse_Last,Spouse_Phone,Spouse_Email_Address,Spouse_Birthday,Contact_Me,Previous_Annual_Giving,Expanded_Annual_Giving,Two_Year_Commitment,Kickoff_Giving,Step_Fearless,Step_Above_and_Beyond,Step_Tithing,Step_Percentage,Step_Consistent,Include_Spouse_Giving,Commitment_Date,Contact_ID
Danny,Tanner,(415) 555-0134,danny.tanner@email.com,09/29/1957,,,,,,false,2.50,4.00,13.00,1.00,true,false,true,false,true,false,2026-03-18,1001
Carl,Winslow,555-0191,carl.winslow@email.com,1958-07-22,Harriette,Winslow,555-0192,harriette.w@email.com,6/14/1960,false,3.00,5.00,16.00,1.50,false,true,false,true,true,true,2026-03-18,1002
Cliff,Huxtable,(718) 555-0287,cliff.huxtable@email.com,12/1/1953,Claire,Huxtable,555.0288,claire.huxtable@email.com,1955-03-15,false,4.00,5.00,18.00,2.00,true,true,true,false,true,true,3/18/2026,
Al,Bundy,555-0343,al.bundy@email.com,1958-04-07,Peggy,Bundy,555-0344,peggy.bundy@email.com,1960-11-05,false,0.50,1.00,2.50,0.25,false,false,false,false,true,true,2026-03-18,1004
Zack,Morris,(619) 555-0401,zack.morris@email.com,1974-03-11,,,,,,false,1.00,2.50,7.00,0.50,true,false,false,true,false,false,03/18/2026,
Tim,Taylor,555 0455,tim@tooltime.com,1958-10-11,Jill,Taylor,555 0456,jill.taylor@email.com,1960-08-20,false,3.50,4.50,16.00,1.00,true,true,false,false,true,true,2026-03-18,1006
Will,Smith,,will.smith@belair.com,9/25/1974,,,,,,yes,1.50,3.00,9.00,0.75,false,true,false,true,false,false,,
Frank,Costanza,555-0521,frank.costanza@email.com,1935-06-15,Estelle,Costanza,5550522,estelle.c@email.com,,false,2.00,3.00,10.00,1.00,false,false,true,false,true,true,2026-03-18,1008
Jesse,Katsopolis,(415) 555-0577,uncle.jesse@email.com,1961-08-05,Becky,Katsopolis,(415) 555-0578,becky.k@email.com,1963-01-09,false,3.00,4.00,14.00,1.25,true,false,true,false,true,true,2026-03-18,
Philip,Banks,555-0633,phil.banks@email.com,1948-05-28,Vivian,Banks,555-0634,,1952-12-18,false,5.00,5.00,20.00,2.50,1,1,1,0,1,1,2026-03-18,1010
Fran,Fine,(718) 555-0689,fran.fine@email.com,02/13/1962,,,,,,true,2.00,3.50,11.00,0.75,false,true,false,true,false,false,3/18/26,
Red,Forman,555-0745,red.forman@email.com,1942-11-03,Kitty,Forman,555-0746,kitty.forman@email.com,1945-06-22,false,1.00,2.00,6.00,0.50,false,false,false,false,true,true,2026-03-18,1012
Steve,Urkel,(312) 555-0801,steve.urkel@email.com,1976-12-20,,,,,,true,0.75,1.50,4.50,0.25,true,false,false,true,false,false,2026-03-18,
Jason,Seaver,555-0857,jason.seaver@email.com,1952-03-10,Maggie,Seaver,5550858,maggie.seaver@email.com,1954-07-14,false,4.00,5.00,18.00,2.00,true,true,true,false,true,true,2026-03-18,1014
Kramer,,(212) 555-0913,kramer@email.com,,,,,,,false,2.50,4.00,15.00,1.00,false,true,false,false,false,false,,
Dan,Conner,(815) 555-0969,dan.conner@email.com,1951-09-14,Roseanne,Conner,(815) 555-0970,roseanne.c@email.com,1953-11-18,false,1.50,2.50,8.00,0.50,false,false,false,true,true,true,2026-03-18,1016
Kelly,Kapowski,(619) 555-1025,kelly.kapowski@email.com,3/25/1974,,,,,,false,1.00,2.00,6.00,0.50,false,true,false,true,false,false,2026-03-18,
George,Costanza,(212) 555-1081,gcostanza@email.com,1958-04-29,,,,,,true,0.50,1.00,3.00,0.25,false,false,false,false,true,false,2026-03-18,1018
Topanga,Lawrence,(215) 555-1137,topanga@email.com,1981-08-14,,,,,,false,2.00,3.50,11.00,1.00,true,false,true,false,false,false,3/18/2026,
Doug,Heffernan,555-1193,doug.heffernan@email.com,1968-02-09,Carrie,Heffernan,555-1194,carrie.h@email.com,1970-05-03,false,3.00,4.50,15.00,1.50,false,true,false,true,true,true,2026-03-18,1020`;

const CSV_COLUMNS = [
  'First_Name', 'Last_Name', 'Phone', 'Email_Address', 'Birthday',
  'Spouse_First', 'Spouse_Last', 'Spouse_Phone', 'Spouse_Email_Address', 'Spouse_Birthday',
  'Contact_Me', 'Previous_Annual_Giving', 'Expanded_Annual_Giving',
  'Two_Year_Commitment', 'Kickoff_Giving',
  'Step_Fearless', 'Step_Above_and_Beyond', 'Step_Tithing',
  'Step_Percentage', 'Step_Consistent',
  'Include_Spouse_Giving', 'Commitment_Date', 'Contact_ID',
];

const BOOLEAN_FIELDS = [
  'Contact_Me', 'Step_Fearless', 'Step_Above_and_Beyond', 'Step_Tithing',
  'Step_Percentage', 'Step_Consistent', 'Include_Spouse_Giving',
];

const CURRENCY_FIELDS = ['Previous_Annual_Giving', 'Expanded_Annual_Giving', 'Two_Year_Commitment', 'Kickoff_Giving'];

type EditableRow = Record<string, string | undefined>;

function isTruthy(value: string | undefined): boolean {
  if (!value) return false;
  const lower = value.trim().toLowerCase();
  return lower === 'true' || lower === '1' || lower === 'yes';
}

function computeTwoYearExpected(row: EditableRow): number {
  const prev = parseFloat(row.Previous_Annual_Giving || '0') || 0;
  const expanded = parseFloat(row.Expanded_Annual_Giving || '0') || 0;
  return (prev + expanded) * 2;
}

function hasTwoYearMismatch(row: EditableRow): boolean {
  const entered = parseFloat(row.Two_Year_Commitment || '0') || 0;
  if (entered <= 0) return false;
  const expected = computeTwoYearExpected(row);
  return Math.abs(entered - expected) > 0.01;
}

interface EditRowModalProps {
  row: EditableRow;
  rowIndex: number;
  open: boolean;
  onClose: () => void;
  onSave: (rowIndex: number, updated: EditableRow) => void;
}

function EditRowModal({ row, rowIndex, open, onClose, onSave }: EditRowModalProps) {
  const [draft, setDraft] = useState<EditableRow>({ ...row });

  useEffect(() => {
    if (open) setDraft({ ...row });
  }, [open, row]);

  const updateField = (field: string, value: string) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const toggleBoolean = (field: string) => {
    setDraft((prev) => ({
      ...prev,
      [field]: isTruthy(prev[field]) ? 'false' : 'true',
    }));
  };

  const twoYearMismatch = hasTwoYearMismatch(draft);
  const twoYearExpected = computeTwoYearExpected(draft);

  const handleSave = () => {
    onSave(rowIndex, draft);
    onClose();
  };

  const textFields: { key: string; label: string }[] = [
    { key: 'First_Name', label: 'First Name' },
    { key: 'Last_Name', label: 'Last Name' },
    { key: 'Phone', label: 'Phone' },
    { key: 'Email_Address', label: 'Email' },
    { key: 'Birthday', label: 'Birthday' },
  ];

  const spouseFields: { key: string; label: string }[] = [
    { key: 'Spouse_First', label: 'Spouse First Name' },
    { key: 'Spouse_Last', label: 'Spouse Last Name' },
    { key: 'Spouse_Phone', label: 'Spouse Phone' },
    { key: 'Spouse_Email_Address', label: 'Spouse Email' },
    { key: 'Spouse_Birthday', label: 'Spouse Birthday' },
  ];

  const displayName = [draft.First_Name, draft.Last_Name].filter(Boolean).join(' ') || `Row ${rowIndex + 1}`;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Row {rowIndex + 1}</DialogTitle>
          <DialogDescription>{displayName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Contact Info */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-muted-foreground">Contact Info</legend>
            {textFields.map(({ key, label }) => (
              <div key={key} className="space-y-1">
                <Label htmlFor={`edit-${key}`}>{label}</Label>
                <Input
                  id={`edit-${key}`}
                  value={draft[key] ?? ''}
                  onChange={(e) => updateField(key, e.target.value)}
                />
              </div>
            ))}
          </fieldset>

          {/* Spouse Info */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-muted-foreground">Spouse Info</legend>
            {spouseFields.map(({ key, label }) => (
              <div key={key} className="space-y-1">
                <Label htmlFor={`edit-${key}`}>{label}</Label>
                <Input
                  id={`edit-${key}`}
                  value={draft[key] ?? ''}
                  onChange={(e) => updateField(key, e.target.value)}
                />
              </div>
            ))}
          </fieldset>

          {/* Giving */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-muted-foreground">Giving</legend>
            {CURRENCY_FIELDS.map((key) => (
              <div key={key} className="space-y-1">
                <Label htmlFor={`edit-${key}`}>{key.replace(/_/g, ' ')}</Label>
                <Input
                  id={`edit-${key}`}
                  type="number"
                  step="0.01"
                  min="0"
                  value={draft[key] ?? ''}
                  onChange={(e) => updateField(key, e.target.value)}
                />
              </div>
            ))}
            {twoYearMismatch && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Two-Year Mismatch</AlertTitle>
                <AlertDescription>
                  Entered ${draft.Two_Year_Commitment}, expected (${draft.Previous_Annual_Giving || '0'} + ${draft.Expanded_Annual_Giving || '0'}) &times; 2 = ${twoYearExpected.toFixed(2)}
                </AlertDescription>
              </Alert>
            )}
          </fieldset>

          {/* Steps & Checkboxes */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-muted-foreground">Steps &amp; Options</legend>
            <div className="grid grid-cols-2 gap-3">
              {BOOLEAN_FIELDS.map((key) => (
                <div key={key} className="flex items-center gap-2">
                  <Checkbox
                    id={`edit-${key}`}
                    checked={isTruthy(draft[key])}
                    onCheckedChange={() => toggleBoolean(key)}
                  />
                  <Label htmlFor={`edit-${key}`} className="text-sm font-normal">
                    {key.replace(/_/g, ' ')}
                  </Label>
                </div>
              ))}
            </div>
          </fieldset>

          {/* Metadata */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-muted-foreground">Metadata</legend>
            <div className="space-y-1">
              <Label htmlFor="edit-Commitment_Date">Commitment Date</Label>
              <Input
                id="edit-Commitment_Date"
                value={draft.Commitment_Date ?? ''}
                onChange={(e) => updateField('Commitment_Date', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-Contact_ID">Contact ID</Label>
              <Input
                id="edit-Contact_ID"
                value={draft.Contact_ID ?? ''}
                onChange={(e) => updateField('Contact_ID', e.target.value)}
              />
            </div>
          </fieldset>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
          <Button onClick={handleSave} type="button">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CommitmentImport() {
  const [campaigns, setCampaigns] = useState<PledgeCampaignOption[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<CommitmentImportRow[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [parseError, setParseError] = useState<string>('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<CommitmentImportResult | null>(null);
  const [error, setError] = useState<string>('');
  const [defaultCommitmentDate, setDefaultCommitmentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);

  useEffect(() => {
    getPledgeCampaigns()
      .then(setCampaigns)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load campaigns'))
      .finally(() => setLoadingCampaigns(false));
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParseError('');
    setResult(null);
    setFileName(file.name);

    Papa.parse<CommitmentImportRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setParseError(results.errors.map((err) => `Row ${err.row}: ${err.message}`).join('; '));
          return;
        }
        if (results.data.length === 0) {
          setParseError('CSV file contains no data rows');
          return;
        }
        setParsedRows(results.data);
      },
      error: (err) => {
        setParseError(err.message);
      },
    });
  }, []);

  const handleImport = useCallback(async () => {
    if (!selectedCampaignId || parsedRows.length === 0) return;

    setImporting(true);
    setResult(null);
    setError('');

    try {
      const importResult = await importCommitments(Number(selectedCampaignId), parsedRows, defaultCommitmentDate);
      setResult(importResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  }, [selectedCampaignId, parsedRows, defaultCommitmentDate]);

  const handleDownloadExample = useCallback(() => {
    const blob = new Blob([EXAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'commitment-import-example.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleReset = useCallback(() => {
    setParsedRows([]);
    setFileName('');
    setParseError('');
    setResult(null);
    setError('');
    setEditingRowIndex(null);
  }, []);

  const handleRowSave = useCallback((rowIndex: number, updated: EditableRow) => {
    setParsedRows((prev) => {
      const next = [...prev];
      next[rowIndex] = updated as CommitmentImportRow;
      return next;
    });
  }, []);

  const mismatchRows = useMemo(() => {
    const mismatches: number[] = [];
    for (let i = 0; i < parsedRows.length; i++) {
      if (hasTwoYearMismatch(parsedRows[i] as EditableRow)) {
        mismatches.push(i);
      }
    }
    return new Set(mismatches);
  }, [parsedRows]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Import Commitments</CardTitle>
          <CardDescription>
            Upload a CSV file to bulk-import commitment data into a Pledge Campaign.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Select Campaign */}
          <div className="space-y-2">
            <Label htmlFor="campaign-select">1. Select Pledge Campaign</Label>
            {loadingCampaigns ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading campaigns...
              </div>
            ) : (
              <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                <SelectTrigger id="campaign-select" className="w-full max-w-md">
                  <SelectValue placeholder="Select a campaign..." />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map((campaign) => (
                    <SelectItem
                      key={campaign.Pledge_Campaign_ID}
                      value={String(campaign.Pledge_Campaign_ID)}
                    >
                      {campaign.Campaign_Name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Step 2: Default Commitment Date */}
          <div className="space-y-2">
            <Label htmlFor="default-date">2. Default Commitment Date</Label>
            <Input
              id="default-date"
              type="date"
              value={defaultCommitmentDate}
              onChange={(e) => setDefaultCommitmentDate(e.target.value)}
              className="max-w-md"
            />
            <p className="text-sm text-muted-foreground">
              Used when a row&apos;s Commitment_Date is empty or invalid
            </p>
          </div>

          {/* Step 3: Upload CSV */}
          <div className="space-y-2">
            <Label htmlFor="csv-upload">3. Upload CSV File</Label>
            <div className="flex items-center gap-3">
              <Input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="max-w-md"
                disabled={!selectedCampaignId}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadExample}
                type="button"
              >
                <Download className="h-4 w-4 mr-2" />
                Example CSV
              </Button>
            </div>
            {!selectedCampaignId && (
              <p className="text-sm text-muted-foreground">Select a campaign first</p>
            )}
          </div>

          {parseError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Parse Error</AlertTitle>
              <AlertDescription>{parseError}</AlertDescription>
            </Alert>
          )}

          {/* Step 4: Preview */}
          {parsedRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  4. Preview — {parsedRows.length} row{parsedRows.length !== 1 ? 's' : ''} from {fileName}
                  {mismatchRows.size > 0 && (
                    <span className="text-yellow-600 dark:text-yellow-400 text-xs font-normal">
                      ({mismatchRows.size} two-year mismatch{mismatchRows.size !== 1 ? 'es' : ''})
                    </span>
                  )}
                </Label>
                <Button variant="ghost" size="sm" onClick={handleReset} type="button">
                  Clear
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">Click the edit icon on any row to make corrections before importing.</p>
              <div className="border rounded-md overflow-auto max-h-80">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">#</th>
                      <th className="px-2 py-2" />
                      {CSV_COLUMNS.map((col) => (
                        <th key={col} className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">
                          {col.replace(/_/g, ' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((row, i) => {
                      const isMismatch = mismatchRows.has(i);
                      return (
                        <tr
                          key={i}
                          className={`border-t ${isMismatch ? 'bg-yellow-50 dark:bg-yellow-950/30' : ''}`}
                        >
                          <td className="px-3 py-1.5 text-muted-foreground">{i + 1}</td>
                          <td className="px-2 py-1.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => setEditingRowIndex(i)}
                              type="button"
                              title={`Edit row ${i + 1}`}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          </td>
                          {CSV_COLUMNS.map((col) => (
                            <td key={col} className="px-3 py-1.5 whitespace-nowrap">
                              {(row as Record<string, string | undefined>)[col] ?? ''}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Edit Modal */}
          {editingRowIndex !== null && (
            <EditRowModal
              row={parsedRows[editingRowIndex] as EditableRow}
              rowIndex={editingRowIndex}
              open={true}
              onClose={() => setEditingRowIndex(null)}
              onSave={handleRowSave}
            />
          )}

          {/* Step 5: Import */}
          {parsedRows.length > 0 && !result && (
            <Button
              onClick={handleImport}
              disabled={importing || !selectedCampaignId}
              type="button"
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import {parsedRows.length} Row{parsedRows.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          )}

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-3">
              <Alert variant={result.failed.length === 0 ? 'default' : 'destructive'}>
                {result.failed.length === 0 ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle>Import Complete</AlertTitle>
                <AlertDescription>
                  {result.succeeded} of {result.total} row{result.total !== 1 ? 's' : ''} imported successfully.
                  {result.failed.length > 0 && ` ${result.failed.length} failed.`}
                </AlertDescription>
              </Alert>

              {result.warnings.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Warnings ({result.warnings.length})</AlertTitle>
                  <AlertDescription>
                    These rows were imported but had two-year commitment mismatches.
                  </AlertDescription>
                </Alert>
              )}

              {result.warnings.length > 0 && (
                <div className="border border-yellow-200 rounded-md overflow-auto max-h-48">
                  <table className="w-full text-sm">
                    <thead className="bg-yellow-50 dark:bg-yellow-950 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Row</th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Warning</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.warnings.map((w, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-3 py-1.5">{w.row}</td>
                          <td className="px-3 py-1.5">{w.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {result.failed.length > 0 && (
                <div className="border rounded-md overflow-auto max-h-48">
                  <table className="w-full text-sm">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Row</th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.failed.map((f, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-3 py-1.5">{f.row}</td>
                          <td className="px-3 py-1.5">{f.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <Button variant="outline" onClick={handleReset} type="button">
                Import Another File
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
