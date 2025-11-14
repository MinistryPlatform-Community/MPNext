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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const ContactLogFormSchema = z.object({
  notes: z
    .string()
    .min(1, "Notes are required")
    .max(2000, "Notes must be less than 2000 characters"),
  contactLogType: z.string().optional(),
  contactDate: z.string().min(1, "Contact date is required"),
  contactId: z.number().min(1, "Contact ID is required"),
});

type ContactLogFormData = z.infer<typeof ContactLogFormSchema>;

interface ContactLogsProps {
  contactLogs: ContactLogDisplay[];
  contactId: number;
  contactNickname?: string;
  contactLastName?: string;
  onRefresh?: () => void;
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getTodayLocalDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function ContactLogs({
  contactLogs,
  contactId,
  contactNickname,
  contactLastName,
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
    watch,
  } = useForm<ContactLogFormData>({
    resolver: zodResolver(ContactLogFormSchema),
    defaultValues: {
      contactDate: getTodayLocalDate(),
      contactId: contactId,
    },
  });

  const onCreateLog = async (data: ContactLogFormData) => {
    try {
      setIsCreating(true);
      
      const selectedLogType = logTypes.find(type => type.Contact_Log_Type === data.contactLogType);
      
      const contactLogData = {
        Contact_ID: data.contactId,
        Contact_Date: `${data.contactDate}T00:00:00.000Z`,
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
      reset();
      
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
        Contact_Date: `${data.contactDate}T00:00:00.000Z`,
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
      log.Contact_Date ? log.Contact_Date.split("T")[0] : ""
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
        <Label htmlFor={isEdit ? "editContactDate" : "createContactDate"}>Contact Date</Label>
        <Input
          id={isEdit ? "editContactDate" : "createContactDate"}
          type="date"
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
          value={watch("contactLogType")}
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
            } else {
              setIsCreateModalOpen(false);
            }
            reset();
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
                  {formatDateTime(log.Contact_Date)}
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
