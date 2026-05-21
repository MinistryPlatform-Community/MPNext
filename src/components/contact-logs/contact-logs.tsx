"use client";

import React, { useState, useEffect } from "react";
import { ContactLogDisplay } from "@/lib/dto";
import { ContactLogTypes } from "@/lib/providers/ministry-platform/models/ContactLogTypes";
import { getContactLogTypes, createContactLog, updateContactLog, deleteContactLog } from "./actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Save, Trash2 } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const ContactLogFormSchema = z.object({
  notes: z
    .string()
    .min(1, "Notes are required")
    .max(2000, "Notes must be less than 2000 characters"),
  contactLogType: z.string().optional(),
  contactDate: z.string().min(1, "Contact date and time is required"),
  contactId: z.number().min(1, "Contact ID is required"),
});

type ContactLogFormData = z.infer<typeof ContactLogFormSchema>;

interface ContactLogsProps {
  contactLogs: ContactLogDisplay[];
  contactId: number;
  contactNickname?: string;
  contactLastName?: string;
  mpTimezone: string;
  onRefresh?: () => void;
}

function formatDateTime(dateString: string, timeZone: string): string {
  // MP returns wall-clock datetimes in its domain time zone (no zone marker).
  // `new Date(...)` would parse those as browser-local — wrong for users in
  // a different zone. Treat the string as MP-TZ wall-clock and format with
  // Intl so the displayed value matches MP's database.
  const normalized = dateString.replace("T", " ").split(".")[0];
  const match = normalized.match(
    /^(\d{4})-(\d{2})-(\d{2})(?: (\d{2}):(\d{2})(?::(\d{2}))?)?(?:Z)?$/
  );
  let instant: Date;
  if (match) {
    const [, y, mo, d, h = "00", mi = "00", s = "00"] = match;
    // Build the matching UTC instant by treating the wall-clock as MP-TZ.
    const utcGuess = Date.UTC(+y, +mo - 1, +d, +h, +mi, +s);
    const projectedParts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(new Date(utcGuess));
    const get = (t: string) => Number(projectedParts.find((p) => p.type === t)!.value);
    const projectedHour = get("hour") === 24 ? 0 : get("hour");
    const projectedUtc = Date.UTC(
      get("year"),
      get("month") - 1,
      get("day"),
      projectedHour,
      get("minute"),
      get("second")
    );
    instant = new Date(utcGuess + (utcGuess - projectedUtc));
  } else {
    instant = new Date(dateString);
  }
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(instant);
}

function getNowInMpTz(timeZone: string): string {
  // datetime-local input format: "YYYY-MM-DDTHH:MM" — render "now" as MP-TZ
  // wall-clock so what the user sees matches what we'll store.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  const hour = get("hour") === "24" ? "00" : get("hour");
  return `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}`;
}

function toDatetimeLocalValue(mpDate: string): string {
  // MP returns "YYYY-MM-DDTHH:MM:SS" or "YYYY-MM-DD HH:MM:SS" — trim seconds
  // and any trailing fractional/Z portion to fit the datetime-local format.
  const normalized = mpDate.replace(" ", "T");
  if (normalized.length >= 16) {
    return normalized.slice(0, 16);
  }
  return `${normalized.slice(0, 10)}T00:00`;
}

export function ContactLogs({
  contactLogs,
  contactId,
  contactNickname,
  contactLastName,
  mpTimezone,
  onRefresh,
}: ContactLogsProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingLog, setEditingLog] = useState<ContactLogDisplay | null>(null);
  const [logTypes, setLogTypes] = useState<ContactLogTypes[]>([]);
  const [isLoadingLogTypes, setIsLoadingLogTypes] = useState(false);
  const [deleteLogId, setDeleteLogId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const getContactDisplayName = () => {
    return `${contactNickname || "Contact"} ${contactLastName || ""}`.trim();
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    control,
  } = useForm<ContactLogFormData>({
    resolver: zodResolver(ContactLogFormSchema),
    defaultValues: {
      contactDate: getNowInMpTz(mpTimezone),
      contactId: contactId,
    },
  });

  const resetCreateForm = () => {
    reset({
      contactDate: getNowInMpTz(mpTimezone),
      contactId: contactId,
      notes: "",
      contactLogType: undefined,
    });
  };

  const contactLogTypeValue = useWatch({ control, name: "contactLogType" });

  const onCreateLog = async (data: ContactLogFormData) => {
    try {
      setIsCreating(true);
      
      const selectedLogType = logTypes.find(type => type.Contact_Log_Type === data.contactLogType);
      
      const contactLogData = {
        Contact_ID: data.contactId,
        Contact_Date: data.contactDate,
        Notes: data.notes,
        Contact_Log_Type_ID: selectedLogType?.Contact_Log_Type_ID || null,
        Planned_Contact_ID: null,
        Contact_Successful: null,
        Original_Contact_Log_Entry: null,
        Feedback_Entry_ID: null,
      };

      console.log("Creating contact log with data:", contactLogData);
      
      await createContactLog(contactLogData);

      setIsCreateModalOpen(false);
      resetCreateForm();

      if (onRefresh) {
        onRefresh();
      }

    } catch (err) {
      console.error("Error creating contact log:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to create contact log";
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsCreating(false);
    }
  };

  const onEditLog = async (data: ContactLogFormData) => {
    if (!editingLog) return;

    try {
      setIsEditing(true);
      
      const selectedLogType = logTypes.find(type => type.Contact_Log_Type === data.contactLogType);
      
      const contactLogData = {
        Contact_Date: data.contactDate,
        Notes: data.notes,
        Contact_Log_Type_ID: selectedLogType?.Contact_Log_Type_ID || null,
      };

      console.log("Updating contact log with data:", contactLogData);
      
      await updateContactLog(editingLog.Contact_Log_ID, contactLogData);
      
      setIsEditModalOpen(false);
      setEditingLog(null);
      reset();
      
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error("Error updating contact log:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to update contact log";
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsEditing(false);
    }
  };

  const handleEditClick = (log: ContactLogDisplay) => {
    setEditingLog(log);
    setValue("notes", log.Notes || "");
    setValue("contactLogType", log.Contact_Log_Type || "");
    setValue(
      "contactDate",
      log.Contact_Date ? toDatetimeLocalValue(log.Contact_Date) : ""
    );
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (logId: number) => {
    setDeleteLogId(logId);
  };

  const confirmDelete = async () => {
    if (!deleteLogId) return;

    try {
      setIsDeleting(true);
      await deleteContactLog(deleteLogId);
      
      setDeleteLogId(null);
      
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error("Error deleting contact log:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to delete contact log";
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    const fetchLogTypes = async () => {
      try {
        setIsLoadingLogTypes(true);
        const types = await getContactLogTypes();
        setLogTypes(types);
      } catch (error) {
        console.error("Error fetching contact log types:", error);
        setLogTypes([]);
      } finally {
        setIsLoadingLogTypes(false);
      }
    };

    fetchLogTypes();
  }, []);

  const getLogTypeColor = (logType: string | null | undefined) => {
    if (!logType) {
      return "bg-muted text-foreground";
    }

    switch (logType.toLowerCase()) {
      case "phone call":
        return "bg-blue-500/20 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400";
      case "email":
        return "bg-green-500/20 dark:bg-green-500/10 text-green-700 dark:text-green-400";
      case "meeting":
        return "bg-purple-500/20 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400";
      case "visit":
        return "bg-orange-500/20 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400";
      default:
        return "bg-muted text-foreground";
    }
  };

  const getDisplayLogType = (logType: string | null | undefined) => {
    return logType || "Unknown";
  };

  const logForm = (isEdit: boolean) => (
    <form
      onSubmit={handleSubmit(isEdit ? onEditLog : onCreateLog)}
      className="space-y-4"
    >
      <input
        type="hidden"
        {...register("contactId", { valueAsNumber: true })}
      />

      <div className="space-y-2">
        <Label htmlFor={isEdit ? "editContactDate" : "createContactDate"}>Contact Date &amp; Time</Label>
        <Input
          id={isEdit ? "editContactDate" : "createContactDate"}
          type="datetime-local"
          {...register("contactDate")}
        />
        {errors.contactDate && (
          <p className="text-sm text-red-500">
            {errors.contactDate.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={isEdit ? "editContactLogType" : "createContactLogType"}>Log Type</Label>
        <Select
          onValueChange={(value) => setValue("contactLogType", value)}
          value={contactLogTypeValue}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={
                isLoadingLogTypes ? "Loading..." : "Select log type"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {logTypes.map((type) => (
              <SelectItem
                key={type.Contact_Log_Type_ID.toString()}
                value={type.Contact_Log_Type}
              >
                {type.Contact_Log_Type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.contactLogType && (
          <p className="text-sm text-red-500">
            {errors.contactLogType.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={isEdit ? "editNotes" : "createNotes"}>Notes</Label>
        <Textarea
          id={isEdit ? "editNotes" : "createNotes"}
          {...register("notes")}
          placeholder="Enter contact notes here..."
          className="min-h-[200px] resize-none"
        />
        {errors.notes && (
          <p className="text-sm text-red-500">
            {errors.notes.message}
          </p>
        )}
      </div>

      <div className="flex gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => {
            if (isEdit) {
              setIsEditModalOpen(false);
              setEditingLog(null);
              reset();
            } else {
              setIsCreateModalOpen(false);
              resetCreateForm();
            }
          }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1 flex items-center gap-2"
          disabled={isEdit ? isEditing : isCreating}
        >
          {(isEdit ? isEditing : isCreating) ? (
            isEdit ? "Saving..." : "Creating..."
          ) : (
            <>
              <Save className="h-4 w-4" />
              {isEdit ? "Save Changes" : "Create Log"}
            </>
          )}
        </Button>
      </div>
    </form>
  );

  if (!contactLogs || contactLogs.length === 0) {
    return (
      <div className="bg-card shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-foreground">Contact Logs</h3>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="flex items-center gap-2"
                variant="outline"
                onClick={() => reset()}
              >
                <Plus className="h-4 w-4" />
                Add Log
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>
                  Create New Contact Log - {getContactDisplayName()}
                </DialogTitle>
                <DialogDescription>
                  Add a new contact log entry for this contact.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4">
                {logForm(false)}
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="text-center py-8">
          <div className="text-muted-foreground mb-2">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground">No contact logs found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-foreground">
          Contact Logs ({contactLogs.length})
        </h3>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              className="flex items-center gap-2"
              variant="outline"
              onClick={() => resetCreateForm()}
            >
              <Plus className="h-4 w-4" />
              Add Log
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>
                Create New Contact Log - {getContactDisplayName()}
              </DialogTitle>
              <DialogDescription>
                Add a new contact log entry for this contact.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              {logForm(false)}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>
                Edit Contact Log - {getContactDisplayName()}
              </DialogTitle>
              <DialogDescription>
                Edit the contact log entry for this contact.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              {logForm(true)}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {contactLogs.map((log) => (
          <div
            key={log.Contact_Log_ID}
            className="border border-border rounded-lg p-4 hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLogTypeColor(
                    log.Contact_Log_Type
                  )}`}
                >
                  {getDisplayLogType(log.Contact_Log_Type)}
                </span>
                <span className="text-sm text-muted-foreground">
                  {formatDateTime(log.Contact_Date, mpTimezone)}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEditClick(log)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-500 hover:text-red-700"
                  onClick={() => handleDeleteClick(log.Contact_Log_ID)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {log.Notes && (
              <div className="mb-3">
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {log.Notes}
                </p>
              </div>
            )}

            {log.MadeByContact && log.MadeByContact.length > 0 && (
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <span className="font-medium">
                    {log.MadeByContact[0].Nickname || log.MadeByContact[0].First_Name}{" "}
                    {log.MadeByContact[0].Last_Name}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <AlertDialog open={deleteLogId !== null} onOpenChange={(open) => !open && setDeleteLogId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this contact log entry. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
