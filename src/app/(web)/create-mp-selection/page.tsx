"use client";

import { useState, useEffect, useMemo } from "react";
import { CreateMpSelection, type MpPageOption } from "@/components/create-mp-selection";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDemoContacts, getMpPages, type DemoContact } from "./actions";

// The four key pages and how they map to Contact record fields
const PAGE_FIELD_MAP: Record<string, keyof DemoContact> = {
  Contacts: "contactId",
  Households: "householdId",
  Participants: "participantId",
  Donors: "donorId",
};

// Display names to match against dp_Pages.Display_Name
const KEY_PAGE_NAMES = Object.keys(PAGE_FIELD_MAP);

export default function CreateMpSelectionDemoPage() {
  const [contacts, setContacts] = useState<DemoContact[]>([]);
  const [pageOptions, setPageOptions] = useState<MpPageOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectedPage, setSelectedPage] = useState<MpPageOption | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getDemoContacts(), getMpPages()])
      .then(([contactData, pages]) => {
        setContacts(contactData);

        // Filter to the four key pages
        const options = pages
          .filter((p) =>
            KEY_PAGE_NAMES.some(
              (name) => p.Display_Name.toLowerCase() === name.toLowerCase()
            )
          )
          .map((p) => ({ pageId: p.Page_ID, label: p.Display_Name }));

        setPageOptions(options);
      })
      .catch((err) => console.error("Failed to load demo data:", err))
      .finally(() => setLoading(false));
  }, []);

  const toggleId = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === contacts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(contacts.map((c) => c.contactId)));
    }
  };

  // Derive the record IDs based on which page is selected
  const recordIdsForPage = useMemo(() => {
    if (!selectedPage) return Array.from(selectedIds);

    const field = PAGE_FIELD_MAP[selectedPage.label];
    if (!field || field === "contactId") return Array.from(selectedIds);

    // Map selected contactIds to the corresponding field values, filtering nulls
    const selectedContacts = contacts.filter((c) =>
      selectedIds.has(c.contactId)
    );
    return selectedContacts
      .map((c) => c[field] as number | null)
      .filter((id): id is number => id != null);
  }, [selectedIds, selectedPage, contacts]);

  const allSelected =
    contacts.length > 0 && selectedIds.size === contacts.length;

  return (
    <div className="container mx-auto p-8 sm:p-20 space-y-8 max-w-3xl">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Create MP Selection
        </h1>
        <p className="text-muted-foreground">
          Select contacts below, choose a target page, and save them as a named
          Selection in Ministry Platform.
        </p>
      </div>

      {/* Contact list */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Contacts
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Header row */}
          <div className="flex items-center gap-4 px-6 py-2 border-b bg-muted/40 text-xs font-medium text-muted-foreground">
            <Checkbox
              checked={allSelected}
              onCheckedChange={toggleAll}
              aria-label="Select all"
              disabled={loading || contacts.length === 0}
            />
            <span className="w-24">Contact ID</span>
            <span className="flex-1">Name</span>
            <span className="flex-1">Email</span>
          </div>

          {loading ? (
            <div className="px-6 py-8 text-sm text-muted-foreground">
              Loading contacts...
            </div>
          ) : contacts.length === 0 ? (
            <div className="px-6 py-8 text-sm text-muted-foreground">
              No contacts found.
            </div>
          ) : (
            contacts.map((contact, i) => (
              <div
                key={contact.contactId}
                className={`flex items-center gap-4 px-6 py-3 cursor-pointer hover:bg-muted/30 transition-colors ${
                  i < contacts.length - 1 ? "border-b" : ""
                }`}
                onClick={() => toggleId(contact.contactId)}
              >
                <Checkbox
                  checked={selectedIds.has(contact.contactId)}
                  onCheckedChange={() => toggleId(contact.contactId)}
                  aria-label={`Select ${contact.name}`}
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="w-24 font-mono text-sm text-muted-foreground">
                  {contact.contactId}
                </span>
                <span className="flex-1 text-sm">{contact.name}</span>
                <span className="flex-1 text-sm text-muted-foreground truncate">
                  {contact.email}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Action bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {selectedIds.size === 0
            ? "Select records above to enable the button"
            : `${selectedIds.size} contact${selectedIds.size !== 1 ? "s" : ""} selected → ${recordIdsForPage.length} record ID${recordIdsForPage.length !== 1 ? "s" : ""} for selection`}
        </p>
        <CreateMpSelection
          pageOptions={pageOptions}
          recordIds={recordIdsForPage}
          defaultSelectionName="My Contact Selection"
          triggerLabel="Save as MP Selection"
          onPageChange={setSelectedPage}
          onSuccess={(result) =>
            setLastResult(
              `Selection #${result.selectionId} created — ${result.selectionUrl}`
            )
          }
        />
      </div>

      {/* Success feedback */}
      {lastResult && (
        <div className="rounded-md bg-muted px-4 py-3 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Last result: </span>
          {lastResult}
        </div>
      )}
    </div>
  );
}
