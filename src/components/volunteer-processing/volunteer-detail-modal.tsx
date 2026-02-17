"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { VolunteerCard as VolunteerCardData, VolunteerDetail, ChecklistItemStatus, WriteBackConfig } from "@/lib/dto";
import {
  getVolunteerDetail,
  createVolunteerMilestone,
} from "./actions";

interface VolunteerDetailModalProps {
  volunteer: VolunteerCardData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

function getDisplayName(firstName: string, nickname: string | null): string {
  return nickname && nickname.trim() ? nickname : firstName;
}

function getInitials(firstName: string, nickname: string | null, lastName: string): string {
  const displayFirst = getDisplayName(firstName, nickname);
  const first = displayFirst?.charAt(0)?.toUpperCase() || "";
  const last = lastName?.charAt(0)?.toUpperCase() || "";
  return first + last;
}

function getImageUrl(imageGuid: string): string {
  return `${process.env.NEXT_PUBLIC_MINISTRY_PLATFORM_FILE_URL}/${imageGuid}?$thumbnail=true`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StatusBadge({ item }: { item: ChecklistItemStatus }) {
  const badgeStyles: Record<string, string> = {
    complete: "bg-green-100 text-green-800",
    in_progress: "bg-yellow-100 text-yellow-800",
    expiring_soon: "bg-orange-100 text-orange-800",
    expired: "bg-red-100 text-red-800",
    not_started: "bg-gray-100 text-gray-600",
  };

  const labels: Record<string, string> = {
    complete: "Complete",
    in_progress: "In Progress",
    expiring_soon: "Expiring Soon",
    expired: "Expired",
    not_started: "Not Started",
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badgeStyles[item.status]}`}>
      {labels[item.status]}
    </span>
  );
}

export function VolunteerDetailModal({
  volunteer,
  open,
  onOpenChange,
  onUpdate,
}: VolunteerDetailModalProps) {
  const [detail, setDetail] = useState<VolunteerDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [milestoneNotes, setMilestoneNotes] = useState("");
  const [milestoneDate, setMilestoneDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [selectedMilestoneKey, setSelectedMilestoneKey] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && volunteer) {
      setLoading(true);
      setDetail(null);
      getVolunteerDetail(
        volunteer.info.Contact_ID,
        volunteer.info.Participant_ID,
        volunteer.info.Group_Participant_ID
      )
        .then(setDetail)
        .catch((err) => console.error("Failed to load detail:", err))
        .finally(() => setLoading(false));
    }
  }, [open, volunteer]);

  const handleMarkMilestoneComplete = async (milestoneId: number, programId: number) => {
    if (!volunteer) return;
    setActionLoading(`milestone-${milestoneId}`);
    try {
      const formData = new FormData();
      formData.set("Participant_ID", String(volunteer.info.Participant_ID));
      formData.set("Milestone_ID", String(milestoneId));
      formData.set("Program_ID", String(programId));
      formData.set("Date_Accomplished", new Date(milestoneDate + "T12:00:00").toISOString());
      if (milestoneNotes) {
        formData.set("Notes", milestoneNotes);
      }
      // Attach file if one was selected
      const files = fileInputRef.current?.files;
      if (files) {
        for (const file of Array.from(files)) {
          formData.append("files", file);
        }
      }
      await createVolunteerMilestone(formData);
      setMilestoneNotes("");
      setMilestoneDate(new Date().toISOString().split("T")[0]);
      setSelectedMilestoneKey("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      onUpdate();
      // Refresh detail
      const updated = await getVolunteerDetail(
        volunteer.info.Contact_ID,
        volunteer.info.Participant_ID,
        volunteer.info.Group_Participant_ID
      );
      setDetail(updated);
    } catch (err) {
      console.error("Failed to create milestone:", err);
    } finally {
      setActionLoading(null);
    }
  };

  if (!volunteer) return null;

  const { info } = volunteer;
  const displayName = getDisplayName(info.First_Name, info.Nickname);
  const checklist = detail?.checklist || volunteer.checklist;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full overflow-hidden relative flex-shrink-0">
              {info.Image_GUID ? (
                <Image
                  src={getImageUrl(info.Image_GUID)}
                  alt={`${displayName} ${info.Last_Name}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-lg font-medium">
                  {getInitials(info.First_Name, info.Nickname, info.Last_Name)}
                </div>
              )}
            </div>
            <div>
              <DialogTitle>
                {displayName} {info.Last_Name}
              </DialogTitle>
              <DialogDescription>
                Volunteer since {formatDate(info.Start_Date)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">
            Loading volunteer details...
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            {/* Checklist detail */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Requirements</h3>
              {checklist.map((item) => (
                <div
                  key={item.key}
                  className="flex items-start justify-between gap-3 p-3 rounded-lg border bg-gray-50/50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{item.label}</span>
                      <StatusBadge item={item} />
                    </div>
                    {item.date && (
                      <p className="text-xs text-muted-foreground">
                        Date: {formatDate(item.date)}
                      </p>
                    )}
                    {item.expires && (
                      <p className={`text-xs ${
                        item.status === "expired" ? "text-red-600 font-medium" :
                        item.status === "expiring_soon" ? "text-orange-600 font-medium" :
                        "text-muted-foreground"
                      }`}>
                        Expires: {formatDate(item.expires)}
                      </p>
                    )}
                    {item.detail && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.detail}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Background Check detail */}
            {detail?.backgroundCheck && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900">Background Check Details</h3>
                <div className="text-xs space-y-1 p-3 rounded-lg border bg-gray-50/50">
                  <p>Status: <span className="font-medium">{detail.backgroundCheck.Status}</span></p>
                  {detail.backgroundCheck.Started && (
                    <p>Started: {formatDate(detail.backgroundCheck.Started)}</p>
                  )}
                  {detail.backgroundCheck.Submitted && (
                    <p>Submitted: {formatDate(detail.backgroundCheck.Submitted)}</p>
                  )}
                  {detail.backgroundCheck.Returned && (
                    <p>Returned: {formatDate(detail.backgroundCheck.Returned)}</p>
                  )}
                  {detail.backgroundCheck.All_Clear !== null && (
                    <p>All Clear: <span className={detail.backgroundCheck.All_Clear ? "text-green-600" : "text-red-600"}>
                      {detail.backgroundCheck.All_Clear ? "Yes" : "No"}
                    </span></p>
                  )}
                  {detail.backgroundCheck.Expires && (
                    <p>Expires: {formatDate(detail.backgroundCheck.Expires)}</p>
                  )}
                  {detail.backgroundCheck.Report_Url && (
                    <p>
                      <a
                        href={detail.backgroundCheck.Report_Url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View Report
                      </a>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Write-back: Create Milestone with optional attachment */}
            <div className="space-y-2 pt-2 border-t">
              <h3 className="text-sm font-semibold text-gray-900">Quick Actions</h3>
              <div className="space-y-2">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Label htmlFor="milestone-notes" className="text-xs">Notes (optional)</Label>
                    <Textarea
                      id="milestone-notes"
                      value={milestoneNotes}
                      onChange={(e) => setMilestoneNotes(e.target.value)}
                      placeholder="Add notes for the milestone..."
                      className="text-xs"
                      rows={2}
                    />
                  </div>
                  <div className="w-36">
                    <Label htmlFor="milestone-date" className="text-xs">Date</Label>
                    <Input
                      id="milestone-date"
                      type="date"
                      value={milestoneDate}
                      onChange={(e) => setMilestoneDate(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="file-upload" className="text-xs">Attachment (optional)</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    ref={fileInputRef}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    className="text-xs"
                  />
                </div>
                {(() => {
                  const availableItems = detail?.writeBackConfig
                    ? checklist.filter((item) => item.status === "not_started" && isMilestoneItem(item.key))
                    : [];
                  if (availableItems.length === 0) {
                    return (
                      <p className="text-xs text-muted-foreground">
                        All milestone items are already in progress or complete.
                      </p>
                    );
                  }
                  const selectedId = selectedMilestoneKey && detail?.writeBackConfig
                    ? getMilestoneIdForKey(selectedMilestoneKey, detail.writeBackConfig)
                    : null;
                  const programId = detail?.writeBackConfig?.programId;
                  return (
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <Label htmlFor="milestone-select" className="text-xs">Milestone</Label>
                        <select
                          id="milestone-select"
                          value={selectedMilestoneKey}
                          onChange={(e) => setSelectedMilestoneKey(e.target.value)}
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <option value="">Select a milestone...</option>
                          {availableItems.map((item) => (
                            <option key={item.key} value={item.key}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => selectedId && programId && handleMarkMilestoneComplete(selectedId, programId)}
                        disabled={!selectedId || !programId || actionLoading?.startsWith("milestone-")}
                      >
                        {actionLoading?.startsWith("milestone-") ? "Saving..." : "Mark Complete"}
                      </Button>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function isMilestoneItem(key: string): boolean {
  return ["interview", "reference_1", "reference_2", "reference_3"].includes(key);
}

function getMilestoneIdForKey(key: string, config: WriteBackConfig): number | null {
  switch (key) {
    case "interview":
      return config.interviewMilestoneId;
    case "reference_1":
      return config.referenceMilestoneId;
    case "reference_2":
      return config.reference2MilestoneId || config.referenceMilestoneId;
    case "reference_3":
      return config.reference3MilestoneId || config.referenceMilestoneId;
    default:
      return null;
  }
}
