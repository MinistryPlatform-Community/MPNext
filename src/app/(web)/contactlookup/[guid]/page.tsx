import { Suspense } from "react";
import { ContactLookupDetails } from "@/components/contact-lookup-details";
import {
  getContactDetails,
  getContactLogsByContactId,
} from "@/components/contact-lookup-details/actions";

interface ContactLookupDetailPageProps {
  params: Promise<{
    guid: string;
  }>;
}

export default async function ContactLookupDetailPage({
  params,
}: ContactLookupDetailPageProps) {
  const { guid } = await params;

  const contactPromise = getContactDetails(guid);
  const contactLogsPromise = contactPromise.then((c) =>
    c.Contact_ID ? getContactLogsByContactId(c.Contact_ID) : []
  );

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Suspense
        fallback={
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p>Loading contact details...</p>
            </div>
          </div>
        }
      >
        <ContactLookupDetails
          contactPromise={contactPromise}
          contactLogsPromise={contactLogsPromise}
        />
      </Suspense>
    </div>
  );
}
