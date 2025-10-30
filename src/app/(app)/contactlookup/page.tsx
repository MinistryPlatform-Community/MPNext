"use client";

import { ContactLookup } from "@/components/contact-lookup/contact-lookup";

export default function ContactLookupPage() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center p-8 pb-20 gap-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <h1 className="text-2xl font-bold">Contact Lookup</h1>
      <ContactLookup />
    </div>
  );
}
