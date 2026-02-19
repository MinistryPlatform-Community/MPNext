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
import { VolunteerCard as VolunteerCardData, VolunteerDetail, ChecklistItemStatus, WriteBackConfig, MilestoneFileInfo, MilestoneDetail, CertificationDetail, FormResponseDetail, GroupFilterOption, GroupRoleOption } from "@/lib/dto";
import {
  getVolunteerDetail,
  createVolunteerMilestone,
  createFormResponse,
  uploadVolunteerPhoto,
  updateVolunteerMilestone,
  updateVolunteerCertification,
  updateVolunteerFormResponse,
  getMilestoneFiles,
  getCertificationFiles,
  getFormResponseFiles,
  getApprovedGroupRoles,
  getApprovedGroupsList,
  assignVolunteerToGroup,
} from "./actions";

interface VolunteerDetailModalProps {
  volunteer: VolunteerCardData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
  approvedGroups?: GroupFilterOption[];
  isInProcessTab?: boolean;
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
    presumed_complete: "bg-yellow-100 text-yellow-800",
  };

  const labels: Record<string, string> = {
    complete: "Complete",
    in_progress: "In Progress",
    expiring_soon: "Expiring Soon",
    expired: "Expired",
    not_started: "Not Started",
    presumed_complete: "Missing Record",
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
  approvedGroups,
  isInProcessTab,
}: VolunteerDetailModalProps) {
  const [detail, setDetail] = useState<VolunteerDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [milestoneNotes, setMilestoneNotes] = useState("");
  const [milestoneDate, setMilestoneDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [selectedMilestoneKey, setSelectedMilestoneKey] = useState("");
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [recordFiles, setRecordFiles] = useState<Record<number, MilestoneFileInfo[]>>({});
  const [filesLoading, setFilesLoading] = useState<number | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [assignTargetGroupId, setAssignTargetGroupId] = useState<number | null>(null);
  const [assignTargetRoleId, setAssignTargetRoleId] = useState<number | null>(null);
  const [approvedRoles, setApprovedRoles] = useState<GroupRoleOption[]>([]);
  const [localApprovedGroups, setLocalApprovedGroups] = useState<GroupFilterOption[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB

  useEffect(() => {
    if (open && volunteer) {
      setLoading(true);
      setDetail(null);
      setExpandedKey(null);
      setRecordFiles({});
      setFileError(null);
      setLinkCopied(false);
      setAssignTargetGroupId(null);
      setAssignTargetRoleId(null);
      setAssignError(null);
      setEditingKey(null);
      setEditError(null);
      getVolunteerDetail(
        volunteer.info.Contact_ID,
        volunteer.info.Participant_ID,
        volunteer.info.Group_Participant_ID
      )
        .then((d) => {
          setDetail(d);
          // Pre-fetch files for all milestone records
          if (d?.milestones) {
            for (const m of d.milestones) {
              getMilestoneFiles(m.Participant_Milestone_ID)
                .then((files) => setRecordFiles((prev) => ({ ...prev, [m.Participant_Milestone_ID]: files })))
                .catch(() => setRecordFiles((prev) => ({ ...prev, [m.Participant_Milestone_ID]: [] })));
            }
          }
          // Pre-fetch files for certification record
          if (d?.certification) {
            getCertificationFiles(d.certification.Participant_Certification_ID)
              .then((files) => setRecordFiles((prev) => ({ ...prev, [d.certification!.Participant_Certification_ID]: files })))
              .catch(() => setRecordFiles((prev) => ({ ...prev, [d.certification!.Participant_Certification_ID]: [] })));
          }
          // Pre-fetch files for form response records (application, child protection)
          if (d?.formResponses) {
            for (const fr of d.formResponses) {
              getFormResponseFiles(fr.Form_Response_ID)
                .then((files) => setRecordFiles((prev) => ({ ...prev, [fr.Form_Response_ID]: files })))
                .catch(() => setRecordFiles((prev) => ({ ...prev, [fr.Form_Response_ID]: [] })));
            }
          }
        })
        .catch((err) => console.error("Failed to load detail:", err))
        .finally(() => setLoading(false));
    }
  }, [open, volunteer]);

  // Fetch roles and groups when assign-to-group section should show
  useEffect(() => {
    if (open && volunteer?.fullyApproved && isInProcessTab) {
      getApprovedGroupRoles().then(setApprovedRoles).catch(console.error);
      if (!approvedGroups || approvedGroups.length === 0) {
        getApprovedGroupsList().then(setLocalApprovedGroups).catch(console.error);
      }
    }
  }, [open, volunteer?.fullyApproved, isInProcessTab, approvedGroups]);

  const findMilestoneRecord = (key: string): MilestoneDetail | null => {
    if (!detail) return null;
    const milestones = detail.milestones;
    switch (key) {
      case "interview":
        return milestones.find(m => m.type === "interview") || null;
      case "reference_1":
        return milestones.filter(m => m.type === "reference")[0] || null;
      case "reference_2":
        return milestones.filter(m => m.type === "reference")[1] || null;
      case "reference_3":
        return milestones.filter(m => m.type === "reference")[2] || null;
      case "fully_approved":
        return milestones.find(m => m.type === "fully_approved") || null;
      case "elder_approved_teacher":
        return milestones.find(m => m.type === "elder_approved_teacher") || null;
      default:
        return null;
    }
  };

  const findFormResponseRecord = (key: string): FormResponseDetail | null => {
    if (!detail) return null;
    if (key === "application") return detail.formResponses.find(fr => fr.type === "application") || null;
    if (key === "child_protection") return detail.formResponses.find(fr => fr.type === "child_protection") || null;
    return null;
  };

  const handleToggleExpand = async (key: string) => {
    if (expandedKey === key) {
      setExpandedKey(null);
      return;
    }
    setExpandedKey(key);

    // If this is a milestone item with a record, fetch its files on-demand if not cached
    const milestoneRecord = findMilestoneRecord(key);
    if (milestoneRecord && !(milestoneRecord.Participant_Milestone_ID in recordFiles)) {
      setFilesLoading(milestoneRecord.Participant_Milestone_ID);
      try {
        const files = await getMilestoneFiles(milestoneRecord.Participant_Milestone_ID);
        setRecordFiles(prev => ({ ...prev, [milestoneRecord.Participant_Milestone_ID]: files }));
      } catch (err) {
        console.error("Failed to load milestone files:", err);
        setRecordFiles(prev => ({ ...prev, [milestoneRecord.Participant_Milestone_ID]: [] }));
      } finally {
        setFilesLoading(null);
      }
    }

    // If this is the certification item, fetch its files on-demand if not cached
    if (key === "mandated_reporter" && detail?.certification) {
      const certId = detail.certification.Participant_Certification_ID;
      if (!(certId in recordFiles)) {
        setFilesLoading(certId);
        try {
          const files = await getCertificationFiles(certId);
          setRecordFiles(prev => ({ ...prev, [certId]: files }));
        } catch (err) {
          console.error("Failed to load certification files:", err);
          setRecordFiles(prev => ({ ...prev, [certId]: [] }));
        } finally {
          setFilesLoading(null);
        }
      }
    }

    // If this is a form response item, fetch its files on-demand if not cached
    const frRecord = findFormResponseRecord(key);
    if (frRecord && !(frRecord.Form_Response_ID in recordFiles)) {
      setFilesLoading(frRecord.Form_Response_ID);
      try {
        const files = await getFormResponseFiles(frRecord.Form_Response_ID);
        setRecordFiles(prev => ({ ...prev, [frRecord.Form_Response_ID]: files }));
      } catch (err) {
        console.error("Failed to load form response files:", err);
        setRecordFiles(prev => ({ ...prev, [frRecord.Form_Response_ID]: [] }));
      } finally {
        setFilesLoading(null);
      }
    }
  };

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

  const handleCreateApplication = async () => {
    if (!volunteer || !detail?.writeBackConfig?.applicationFormId) return;
    setActionLoading("application");
    try {
      const formData = new FormData();
      formData.set("Form_ID", String(detail.writeBackConfig.applicationFormId));
      formData.set("Contact_ID", String(volunteer.info.Contact_ID));
      formData.set("Response_Date", new Date(milestoneDate + "T12:00:00").toISOString());
      // Attach files if selected
      const files = fileInputRef.current?.files;
      if (files) {
        for (const file of Array.from(files)) {
          formData.append("files", file);
        }
      }
      await createFormResponse(formData);
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
      console.error("Failed to create form response:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !volunteer) return;

    if (file.size > MAX_FILE_SIZE) {
      setFileError(`Photo is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum 1 MB.`);
      return;
    }

    setPhotoUploading(true);
    setFileError(null);
    try {
      const formData = new FormData();
      formData.set("Contact_ID", String(volunteer.info.Contact_ID));
      formData.set("photo", file);
      const result = await uploadVolunteerPhoto(formData);
      if (!result.success) {
        setFileError(result.error || "Upload failed");
        return;
      }
      // Refresh detail to get new Image_GUID
      const updated = await getVolunteerDetail(
        volunteer.info.Contact_ID,
        volunteer.info.Participant_ID,
        volunteer.info.Group_Participant_ID
      );
      setDetail(updated);
      onUpdate();
    } catch (err) {
      console.error("Photo upload failed:", err);
      setFileError("Failed to upload photo");
    } finally {
      setPhotoUploading(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const handleAssignToGroup = async () => {
    if (!volunteer || !assignTargetGroupId || !assignTargetRoleId) return;
    setAssignLoading(true);
    setAssignError(null);
    try {
      const formData = new FormData();
      formData.set("currentGroupParticipantId", String(volunteer.info.Group_Participant_ID));
      formData.set("participantId", String(volunteer.info.Participant_ID));
      formData.set("targetGroupId", String(assignTargetGroupId));
      formData.set("targetRoleId", String(assignTargetRoleId));
      const result = await assignVolunteerToGroup(formData);
      if (!result.success) {
        setAssignError(result.error || "Assignment failed");
        return;
      }
      onUpdate();
      onOpenChange(false);
    } catch (err) {
      console.error("Assignment failed:", err);
      setAssignError("Failed to assign volunteer to group");
    } finally {
      setAssignLoading(false);
    }
  };

  const handleStartEdit = (key: string) => {
    // Pre-fill edit fields from existing record data
    const milestoneRecord = findMilestoneRecord(key);
    const formResponseRecord = findFormResponseRecord(key);
    const isCert = key === "mandated_reporter";
    const certRecord = isCert ? detail?.certification : null;

    if (milestoneRecord) {
      setEditDate(milestoneRecord.Date_Accomplished ? milestoneRecord.Date_Accomplished.split("T")[0] : "");
      setEditNotes(milestoneRecord.Notes || "");
    } else if (certRecord) {
      setEditDate(certRecord.Completed ? certRecord.Completed.split("T")[0] : "");
      setEditNotes(certRecord.Notes || "");
    } else if (formResponseRecord) {
      setEditDate(formResponseRecord.Response_Date ? formResponseRecord.Response_Date.split("T")[0] : "");
      setEditNotes("");
    }

    setEditError(null);
    setEditingKey(key);
    // Expand the item so the edit form is visible
    setExpandedKey(key);
  };

  const handleCancelEdit = () => {
    setEditingKey(null);
    setEditError(null);
    if (editFileInputRef.current) editFileInputRef.current.value = "";
  };

  const handleSaveEdit = async () => {
    if (!editingKey || !volunteer) return;
    setEditSaving(true);
    setEditError(null);

    try {
      const milestoneRecord = findMilestoneRecord(editingKey);
      const formResponseRecord = findFormResponseRecord(editingKey);
      const isCert = editingKey === "mandated_reporter";
      const certRecord = isCert ? detail?.certification : null;

      // Collect files from edit file input
      const editFiles: File[] = [];
      if (editFileInputRef.current?.files) {
        for (const file of Array.from(editFileInputRef.current.files)) {
          if (file.size > MAX_FILE_SIZE) {
            setEditError(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum 1 MB.`);
            setEditSaving(false);
            return;
          }
          editFiles.push(file);
        }
      }

      const formData = new FormData();

      if (milestoneRecord) {
        formData.set("Participant_Milestone_ID", String(milestoneRecord.Participant_Milestone_ID));
        if (editDate) formData.set("Date_Accomplished", new Date(editDate + "T12:00:00").toISOString());
        formData.set("Notes", editNotes);
        for (const file of editFiles) formData.append("files", file);
        const result = await updateVolunteerMilestone(formData);
        if (!result.success) { setEditError(result.error || "Update failed"); setEditSaving(false); return; }
      } else if (certRecord) {
        formData.set("Participant_Certification_ID", String(certRecord.Participant_Certification_ID));
        if (editDate) formData.set("Certification_Completed", new Date(editDate + "T12:00:00").toISOString());
        formData.set("Notes", editNotes);
        for (const file of editFiles) formData.append("files", file);
        const result = await updateVolunteerCertification(formData);
        if (!result.success) { setEditError(result.error || "Update failed"); setEditSaving(false); return; }
      } else if (formResponseRecord) {
        formData.set("Form_Response_ID", String(formResponseRecord.Form_Response_ID));
        if (editDate) formData.set("Response_Date", new Date(editDate + "T12:00:00").toISOString());
        for (const file of editFiles) formData.append("files", file);
        const result = await updateVolunteerFormResponse(formData);
        if (!result.success) { setEditError(result.error || "Update failed"); setEditSaving(false); return; }
      }

      // Refresh detail and file cache
      const updated = await getVolunteerDetail(
        volunteer.info.Contact_ID,
        volunteer.info.Participant_ID,
        volunteer.info.Group_Participant_ID
      );
      setDetail(updated);

      // Refresh files for this record if files were added
      const recordId = milestoneRecord?.Participant_Milestone_ID
        ?? certRecord?.Participant_Certification_ID
        ?? formResponseRecord?.Form_Response_ID;
      if (recordId && editFiles.length > 0) {
        let freshFiles: MilestoneFileInfo[] = [];
        if (milestoneRecord) freshFiles = await getMilestoneFiles(recordId);
        else if (certRecord) freshFiles = await getCertificationFiles(recordId);
        else if (formResponseRecord) freshFiles = await getFormResponseFiles(recordId);
        setRecordFiles(prev => ({ ...prev, [recordId]: freshFiles }));
      }

      setEditingKey(null);
      if (editFileInputRef.current) editFileInputRef.current.value = "";
      onUpdate();
    } catch (err) {
      console.error("Failed to save edit:", err);
      setEditError("Failed to save changes");
    } finally {
      setEditSaving(false);
    }
  };

  if (!volunteer) return null;

  const { info } = volunteer;
  const displayName = getDisplayName(info.First_Name, info.Nickname);
  const checklist = detail?.checklist || volunteer.checklist;
  const currentImageGuid = detail?.info.Image_GUID ?? info.Image_GUID;
  const mpBaseOrigin = process.env.NEXT_PUBLIC_MINISTRY_PLATFORM_FILE_URL
    ? new URL(process.env.NEXT_PUBLIC_MINISTRY_PLATFORM_FILE_URL).origin
    : null;
  const mpParticipantUrl = mpBaseOrigin ? `${mpBaseOrigin}/mp/355/${info.Participant_ID}` : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-full overflow-hidden relative flex-shrink-0 cursor-pointer group"
              onClick={() => photoInputRef.current?.click()}
              title={photoUploading ? "Uploading..." : "Upload photo"}
            >
              {currentImageGuid ? (
                <>
                  <Image
                    src={getImageUrl(currentImageGuid)}
                    alt={`${displayName} ${info.Last_Name}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  {photoUploading ? (
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-medium">...</span>
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                      </svg>
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-lg font-medium relative">
                  {photoUploading ? (
                    <span className="text-xs text-gray-500">...</span>
                  ) : (
                    <>
                      {getInitials(info.First_Name, info.Nickname, info.Last_Name)}
                      <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                        </svg>
                      </div>
                    </>
                  )}
                </div>
              )}
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>
            <div>
              <DialogTitle>
                {displayName} {info.Last_Name}
              </DialogTitle>
              <DialogDescription>
                Volunteer since {formatDate(info.Start_Date)}
                {mpParticipantUrl && (
                  <>
                    {" — "}
                    <a
                      href={mpParticipantUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View in MP
                    </a>
                  </>
                )}
                {" — "}
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    const url = `${window.location.origin}/volunteer-processing?volunteer=${info.Group_Participant_ID}`;
                    try {
                      await navigator.clipboard.writeText(url);
                      setLinkCopied(true);
                      setTimeout(() => setLinkCopied(false), 2000);
                    } catch {
                      console.error("Failed to copy link");
                    }
                  }}
                  className="text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  {linkCopied ? (
                    <span className="text-green-600">Copied!</span>
                  ) : (
                    <>
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                      </svg>
                      Copy Link
                    </>
                  )}
                </button>
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
            {/* Assign to Group - only for fully approved volunteers on In Process tab */}
            {volunteer.fullyApproved && isInProcessTab && (
              <div className="space-y-2 rounded-lg border bg-green-50/50 p-3">
                <h3 className="text-sm font-semibold text-gray-900">Assign to Group</h3>
                <p className="text-xs text-muted-foreground">
                  Move this approved volunteer to their serving group.
                </p>
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="assign-group" className="text-xs">Target Group</Label>
                    <select
                      id="assign-group"
                      value={assignTargetGroupId ?? ""}
                      onChange={(e) => setAssignTargetGroupId(e.target.value ? Number(e.target.value) : null)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="">Select a group...</option>
                      {((approvedGroups && approvedGroups.length > 0) ? approvedGroups : localApprovedGroups).map((group) => (
                        <option key={group.Group_ID} value={group.Group_ID}>
                          {group.Group_Name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="assign-role" className="text-xs">Role</Label>
                    <select
                      id="assign-role"
                      value={assignTargetRoleId ?? ""}
                      onChange={(e) => setAssignTargetRoleId(e.target.value ? Number(e.target.value) : null)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="">Select a role...</option>
                      {approvedRoles.map((role) => (
                        <option key={role.Group_Role_ID} value={role.Group_Role_ID}>
                          {role.Role_Title}
                        </option>
                      ))}
                    </select>
                  </div>
                  {assignError && (
                    <p className="text-xs text-red-600">{assignError}</p>
                  )}
                  <Button
                    size="sm"
                    onClick={handleAssignToGroup}
                    disabled={!assignTargetGroupId || !assignTargetRoleId || assignLoading}
                    className="w-full"
                  >
                    {assignLoading ? "Assigning..." : "Assign to Group"}
                  </Button>
                </div>
              </div>
            )}

            {/* Checklist detail */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Requirements</h3>
              {checklist.map((item) => {
                const isMilestone = isMilestoneItem(item.key);
                const milestoneRecord = isMilestone ? findMilestoneRecord(item.key) : null;
                const isCert = item.key === "mandated_reporter";
                const certRecord = isCert ? detail?.certification : null;
                const formResponseRecord = findFormResponseRecord(item.key);
                const isExpanded = expandedKey === item.key;
                const hasExpandableContent = (isMilestone && milestoneRecord) || (isCert && certRecord) || !!formResponseRecord;
                const isEditing = editingKey === item.key;
                const isBackgroundCheck = item.key === "background_check";
                // Editable if it has a record and is not background check
                const isEditable = hasExpandableContent && !isBackgroundCheck;

                // Resolve the record ID, notes, and files for milestones, certifications, or form responses
                const expandRecordId = milestoneRecord
                  ? milestoneRecord.Participant_Milestone_ID
                  : certRecord?.Participant_Certification_ID
                  ?? formResponseRecord?.Form_Response_ID
                  ?? null;
                const expandNotes = milestoneRecord?.Notes ?? certRecord?.Notes ?? null;
                const files = expandRecordId ? recordFiles[expandRecordId] : undefined;
                const isLoadingFiles = expandRecordId !== null && filesLoading === expandRecordId;

                // MP record link
                const mpRecordUrl = mpBaseOrigin
                  ? milestoneRecord ? `${mpBaseOrigin}/mp/344/${milestoneRecord.Participant_Milestone_ID}`
                  : certRecord ? `${mpBaseOrigin}/mp/539/${certRecord.Participant_Certification_ID}`
                  : formResponseRecord ? `${mpBaseOrigin}/mp/424/${formResponseRecord.Form_Response_ID}`
                  : (isBackgroundCheck && detail?.backgroundCheck) ? `${mpBaseOrigin}/mp/279/${detail.backgroundCheck.Background_Check_ID}`
                  : null : null;

                return (
                  <div key={item.key} className="rounded-lg border bg-gray-50/50 overflow-hidden">
                    <div
                      className={`flex items-start justify-between gap-3 p-3 ${hasExpandableContent ? "cursor-pointer hover:bg-gray-100/50" : ""}`}
                      onClick={hasExpandableContent ? () => handleToggleExpand(item.key) : undefined}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{item.label}</span>
                          {files && files.length > 0 && (
                            <svg className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                          )}
                          {mpRecordUrl && (
                            <a
                              href={mpRecordUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-[10px] text-blue-600 hover:underline flex-shrink-0 inline-flex items-center gap-0.5"
                            >
                              <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7h3a5 5 0 010 10h-3m-6 0H6A5 5 0 016 7h3M8 12h8" />
                              </svg>
                              MP
                            </a>
                          )}
                          <StatusBadge item={item} />
                          {isEditable && !isEditing && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleStartEdit(item.key); }}
                              className="p-0.5 rounded hover:bg-gray-200 transition-colors"
                              title="Edit"
                            >
                              <svg className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                              </svg>
                            </button>
                          )}
                          {hasExpandableContent && !isEditing && (
                            <svg
                              className={`h-3.5 w-3.5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          )}
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
                        {item.status === "presumed_complete" && (
                          <p className="text-xs text-yellow-700 mt-0.5">
                            Missing record — likely on file
                          </p>
                        )}
                        {item.detail && !isExpanded && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.detail}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Edit mode */}
                    {isEditing && (
                      <div className="px-3 pb-3 border-t bg-blue-50/50 space-y-2">
                        <div className="pt-2 flex items-center gap-2">
                          <div className="flex-1">
                            <Label className="text-xs">Date</Label>
                            <Input
                              type="date"
                              value={editDate}
                              onChange={(e) => setEditDate(e.target.value)}
                              className="text-xs h-8"
                            />
                          </div>
                          {/* Notes field - not for form responses which don't have notes */}
                          {!formResponseRecord && (
                            <div className="flex-1">
                              <Label className="text-xs">Notes</Label>
                              <Textarea
                                value={editNotes}
                                onChange={(e) => setEditNotes(e.target.value)}
                                className="text-xs"
                                rows={2}
                              />
                            </div>
                          )}
                        </div>
                        <div>
                          <Label className="text-xs">Add File</Label>
                          <Input
                            type="file"
                            ref={editFileInputRef}
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            className="text-xs h-8"
                          />
                        </div>
                        {/* Existing files */}
                        {files && files.length > 0 && (
                          <div className="pt-1">
                            <p className="text-xs font-medium text-gray-700 mb-1">Existing Attachments</p>
                            <div className="space-y-1">
                              {files.map((file) => (
                                <a
                                  key={file.fileId}
                                  href={file.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline block truncate"
                                >
                                  {file.fileName}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                        {editError && (
                          <p className="text-xs text-red-600">{editError}</p>
                        )}
                        <div className="flex items-center gap-2 pt-1">
                          <Button size="sm" onClick={handleSaveEdit} disabled={editSaving} className="text-xs h-7 px-3">
                            {editSaving ? "Saving..." : "Save"}
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancelEdit} disabled={editSaving} className="text-xs h-7 px-3">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Expanded content (milestones and certifications) - read-only view */}
                    {isExpanded && hasExpandableContent && !isEditing && (
                      <div className="px-3 pb-3 border-t bg-white space-y-2">
                        {/* Notes */}
                        {expandNotes && (
                          <div className="pt-2">
                            <p className="text-xs font-medium text-gray-700 mb-0.5">Notes</p>
                            <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                              {expandNotes}
                            </p>
                          </div>
                        )}

                        {/* Files */}
                        <div className="pt-1">
                          <p className="text-xs font-medium text-gray-700 mb-1">Attachments</p>
                          {isLoadingFiles ? (
                            <p className="text-xs text-muted-foreground">Loading files...</p>
                          ) : files && files.length > 0 ? (
                            <div className="space-y-1.5">
                              {files.map((file) => (
                                <div key={file.fileId} className="flex items-center gap-2">
                                  {file.isPdf ? (
                                    <svg className="h-4 w-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                    </svg>
                                  ) : file.isImage ? (
                                    <svg className="h-4 w-4 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                                    </svg>
                                  ) : (
                                    <svg className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                    </svg>
                                  )}
                                  <a
                                    href={file.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:underline truncate"
                                  >
                                    {file.fileName}
                                  </a>
                                </div>
                              ))}
                            </div>
                          ) : files ? (
                            <p className="text-xs text-muted-foreground">No attachments</p>
                          ) : null}
                        </div>

                      </div>
                    )}
                  </div>
                );
              })}
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
                        View Report on Verified First
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
                  {selectedMilestoneKey !== "application" && (
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
                  )}
                  <div className={selectedMilestoneKey === "application" ? "flex-1" : "w-36"}>
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
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && file.size > MAX_FILE_SIZE) {
                        setFileError(`File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum size is 1 MB.`);
                      } else {
                        setFileError(null);
                      }
                    }}
                  />
                  {fileError && (
                    <p className="text-xs text-red-600 mt-1">{fileError}</p>
                  )}
                </div>
                {(() => {
                  const availableItems = detail?.writeBackConfig
                    ? checklist.filter((item) => (item.status === "not_started" || item.status === "presumed_complete") && isCreatableItem(item.key))
                    : [];
                  if (availableItems.length === 0) {
                    return (
                      <p className="text-xs text-muted-foreground">
                        All items are already in progress or complete.
                      </p>
                    );
                  }
                  const isApplicationSelected = selectedMilestoneKey === "application";
                  const selectedId = selectedMilestoneKey && detail?.writeBackConfig && !isApplicationSelected
                    ? getMilestoneIdForKey(selectedMilestoneKey, detail.writeBackConfig)
                    : null;
                  const programId = detail?.writeBackConfig?.programId;
                  const applicationFormId = detail?.writeBackConfig?.applicationFormId;
                  const canSubmit = isApplicationSelected
                    ? !!applicationFormId
                    : !!selectedId && !!programId;
                  return (
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <Label htmlFor="milestone-select" className="text-xs">Item</Label>
                        <select
                          id="milestone-select"
                          value={selectedMilestoneKey}
                          onChange={(e) => setSelectedMilestoneKey(e.target.value)}
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <option value="">Select an item...</option>
                          {availableItems.map((item) => (
                            <option key={item.key} value={item.key}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          if (isApplicationSelected) {
                            handleCreateApplication();
                          } else if (selectedId && programId) {
                            handleMarkMilestoneComplete(selectedId, programId);
                          }
                        }}
                        disabled={!selectedMilestoneKey || !canSubmit || actionLoading !== null || !!fileError}
                      >
                        {actionLoading ? "Saving..." : "Mark Complete"}
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
  return ["interview", "reference_1", "reference_2", "reference_3", "fully_approved", "elder_approved_teacher"].includes(key);
}

function isCreatableItem(key: string): boolean {
  return isMilestoneItem(key) || key === "application";
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
    case "fully_approved":
      return config.fullyApprovedMilestoneId;
    case "elder_approved_teacher":
      return config.elderApprovedTeacherMilestoneId;
    default:
      return null;
  }
}
