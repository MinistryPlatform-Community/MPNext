"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ContactSearch } from "@/lib/dto";

interface ContactLookupResultsProps {
  results: ContactSearch[];
  loading?: boolean;
  error?: string;
  onContactSelect?: (contact: ContactSearch) => void;
}

export const ContactLookupResults: React.FC<ContactLookupResultsProps> = ({
  results,
  loading = false,
  error,
  onContactSelect,
}) => {
  const router = useRouter();

  const handleContactClick = (contact: ContactSearch) => {
    // Call the optional callback first
    onContactSelect?.(contact);

    // Navigate to the contact detail page
    if (contact.Contact_GUID) {
      router.push(`/contactlookup/${contact.Contact_GUID}`);
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500">Searching contacts...</div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500 bg-red-50 rounded-md">
        Error: {error}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">No contacts found</div>
    );
  }

  const getDisplayName = (firstName?: string, nickname?: string) => {
    return nickname && nickname.trim() ? nickname : firstName;
  };

  const getInitials = (
    firstName?: string,
    nickname?: string,
    lastName?: string
  ) => {
    const displayFirstName = getDisplayName(firstName, nickname);
    const first = displayFirstName?.charAt(0)?.toUpperCase() || "";
    const last = lastName?.charAt(0)?.toUpperCase() || "";
    return first + last;
  };

  const getImageUrl = (imageGuid: string) => {
    return `${process.env.NEXT_PUBLIC_MINISTRY_PLATFORM_FILE_URL}/${imageGuid}?$thumbnail=true`;
  };

  return (
    <div className="border rounded-md bg-white shadow-sm">
      <div className="p-2 bg-gray-50 border-b text-sm font-medium text-gray-700">
        {results.length} contact{results.length !== 1 ? "s" : ""} found
      </div>
      <div className="max-h-96 overflow-y-auto">
        {results.map((contact) => (
          <div
            key={contact.Contact_ID}
            className="p-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => handleContactClick(contact)}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden">
                {contact.Image_GUID ? (
                  <img
                    src={getImageUrl(contact.Image_GUID)}
                    alt={`${getDisplayName(
                      contact.First_Name,
                      contact.Nickname
                    )} ${contact.Last_Name}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to initials if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `
                          <div class="w-full h-full bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-sm font-medium">
                            ${getInitials(
                              contact.First_Name,
                              contact.Nickname,
                              contact.Last_Name
                            )}
                          </div>
                        `;
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-sm font-medium">
                    {getInitials(
                      contact.First_Name,
                      contact.Nickname,
                      contact.Last_Name
                    )}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900">
                  {getDisplayName(contact.First_Name, contact.Nickname)}{" "}
                  {contact.Last_Name}
                </div>
                {contact.Email_Address && (
                  <div className="text-sm text-gray-600 truncate">
                    {contact.Email_Address}
                  </div>
                )}
                {contact.Mobile_Phone && (
                  <div className="text-sm text-gray-600">
                    {contact.Mobile_Phone}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
