"use client";

import React, { use } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ContactLookupDetails as ContactLookupDetailsType,
  ContactLogDisplay,
} from "@/lib/dto";
import { ContactLogs } from "@/components/contact-logs";

interface ContactLookupDetailsProps {
  contactPromise: Promise<ContactLookupDetailsType>;
  contactLogsPromise: Promise<ContactLogDisplay[]>;
}

export const ContactLookupDetails: React.FC<ContactLookupDetailsProps> = ({
  contactPromise,
  contactLogsPromise,
}) => {
  const contact = use(contactPromise);
  const contactLogs = use(contactLogsPromise);
  const router = useRouter();

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

  if (!contact) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              No Contact Found
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>No contact details found for the provided GUID.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const displayName = getDisplayName(contact.First_Name, contact.Nickname);

  return (
    <>
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center space-x-5">
            <div className="flex-shrink-0">
              <div className="h-20 w-20 rounded-full overflow-hidden relative">
                {contact.Image_GUID ? (
                  <Image
                    src={getImageUrl(contact.Image_GUID)}
                    alt={`${displayName} ${contact.Last_Name}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-xl font-medium">
                    {getInitials(
                      contact.First_Name,
                      contact.Nickname,
                      contact.Last_Name
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 truncate">
                {displayName} {contact.Last_Name}
              </h1>
              <p className="text-sm text-gray-500">
                GUID: {contact.Contact_GUID}
              </p>
            </div>
          </div>

          <div className="mt-6 border-t border-gray-200 pt-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">First Name</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {contact.First_Name || "N/A"}
                </dd>
              </div>

              {contact.Nickname && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Nickname</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {contact.Nickname}
                  </dd>
                </div>
              )}

              <div>
                <dt className="text-sm font-medium text-gray-500">Last Name</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {contact.Last_Name || "N/A"}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Email Address
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {contact.Email_Address ? (
                    <a
                      href={`mailto:${contact.Email_Address}`}
                      className="text-blue-600 hover:text-blue-500"
                    >
                      {contact.Email_Address}
                    </a>
                  ) : (
                    "N/A"
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Mobile Phone
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {contact.Mobile_Phone ? (
                    <a
                      href={`tel:${contact.Mobile_Phone}`}
                      className="text-blue-600 hover:text-blue-500"
                    >
                      {contact.Mobile_Phone}
                    </a>
                  ) : (
                    "N/A"
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <ContactLogs
        contactLogs={contactLogs}
        contactId={contact.Contact_ID}
        contactNickname={contact.Nickname}
        contactLastName={contact.Last_Name}
        onRefresh={() => router.refresh()}
      />
    </>
  );
};
