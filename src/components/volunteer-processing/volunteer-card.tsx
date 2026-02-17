"use client";

import React from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { VolunteerCard as VolunteerCardData, ChecklistItemStatus } from "@/lib/dto";

interface VolunteerCardProps {
  volunteer: VolunteerCardData;
  onClick: () => void;
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

function StatusIcon({ item }: { item: ChecklistItemStatus }) {
  switch (item.status) {
    case "complete":
      return (
        <svg className="h-4 w-4 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      );
    case "in_progress":
      return (
        <svg className="h-4 w-4 text-yellow-500 flex-shrink-0 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "expiring_soon":
      return (
        <svg className="h-4 w-4 text-orange-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      );
    case "expired":
      return (
        <svg className="h-4 w-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    default:
      return (
        <div className="h-4 w-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
      );
  }
}

export function VolunteerCard({ volunteer, onClick }: VolunteerCardProps) {
  const { info, checklist, completedCount, totalCount } = volunteer;
  const displayName = getDisplayName(info.First_Name, info.Nickname);

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow py-4 gap-3"
      onClick={onClick}
    >
      <CardContent className="flex flex-col items-center px-3">
        {/* Photo */}
        <div className="w-16 h-16 rounded-full overflow-hidden relative flex-shrink-0 mb-2">
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

        {/* Name */}
        <div className="text-sm font-medium text-center truncate w-full">
          {displayName} {info.Last_Name}
        </div>

        {/* Progress indicator */}
        <div className="text-xs text-muted-foreground mb-2">
          {completedCount}/{totalCount} complete
        </div>

        {/* Checklist */}
        <div className="w-full space-y-1">
          {checklist.map((item) => (
            <div key={item.key} className="flex items-center gap-1.5">
              <StatusIcon item={item} />
              <span className={`text-xs truncate ${
                item.status === "expired" ? "text-red-600 line-through" :
                item.status === "expiring_soon" ? "text-orange-600" :
                item.status === "complete" ? "text-gray-700" :
                item.status === "in_progress" ? "text-yellow-700" :
                "text-gray-400"
              }`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
