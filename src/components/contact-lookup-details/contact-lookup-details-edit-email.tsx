"use client";

import React, { useEffect, useState } from "react";
import { getContactDetails, updateContactEmailMobile } from "./actions";
import { ContactLookupDetails } from "@/lib/dto";

interface ContactLookupDetailsEditEmailProps {
  guid: string;
}

export function ContactLookupDetailsEditEmail({
  guid,
}: ContactLookupDetailsEditEmailProps) {
  const [contact, setContact] = useState<ContactLookupDetails | null>(null);
  const [email, setEmail] = useState<string>("");
  const [mobile, setMobile] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;

    const fetchContactDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const contactDetails = await getContactDetails(guid);

        if (!mounted) return;

        setContact(contactDetails);
        setEmail(contactDetails.Email_Address ?? "");
        setMobile(contactDetails.Mobile_Phone ?? "");
      } catch (err) {
        if (!mounted) return;
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load contact";
        setError(errorMessage);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    if (guid) {
      fetchContactDetails();
    }

    return () => {
      mounted = false;
    };
  }, [guid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contact) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await updateContactEmailMobile({
        contactId: contact.Contact_ID,
        Email_Address: email || null,
        Mobile_Phone: mobile || null,
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to save changes";
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading contact details...</p>
        </div>
      </div>
    );
  }

  if (error && !contact) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Edit Contact Information
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              placeholder="name@example.com"
              disabled={saving}
            />
          </div>

          <div>
            <label
              htmlFor="mobile"
              className="block text-sm font-medium text-gray-700"
            >
              Mobile Phone
            </label>
            <input
              id="mobile"
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              placeholder="(555) 555-5555"
              disabled={saving}
            />
          </div>

          {error && contact && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <p className="text-sm text-green-700">
                Contact updated successfully
              </p>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
