import { Suspense } from "react";
import { redirect } from "next/navigation";
import {
  AuthorizationService,
  UnauthorizedError,
} from "@/services/authorizationService";
import { ContactLookupDetails } from "@/components/contact-lookup-details";
import {
  getContactDetails,
  getContactLogsByContactId,
} from "@/components/contact-lookup-details/actions";
import { getMpTimezone } from "@/components/shared-actions/domain";

interface ContactLookupDetailPageProps {
  params: Promise<{
    guid: string;
  }>;
}

export default async function ContactLookupDetailPage({
  params,
}: ContactLookupDetailPageProps) {
  // Self-gating, before ANY data call. The `/contactlookup` layout's check is
  // only a UX redirect: Next renders this page as its own segment, in
  // parallel with the layout, and a layout `redirect()` does not stop it
  // running or reaching the RSC payload (node_modules/next/dist/docs/01-app/
  // 02-guides/authentication.md, "Layouts and auth checks"). Without this
  // gate the page's safety would rest entirely on each action it calls being
  // gated — true today, but one ungated call away from leaking member data.
  // `requireSecurityRole` (not `hasSecurityRole`) because this IS an
  // enforcement point, so a refusal is logged as `mp.read.unauthorized`.
  try {
    await AuthorizationService.getInstance().requireSecurityRole({
      table: "Contacts",
      operation: "read",
    });
  } catch (err) {
    // Only a refusal becomes a redirect. A failed role read still throws to
    // the error boundary. (A session / MP `User_ID` resolution failure does
    // surface as a refusal — `no_mp_user` — and so as /no-access; see the
    // known gap on `AuthorizationService.hasSecurityRole`.)
    if (err instanceof UnauthorizedError) redirect("/no-access");
    throw err;
  }

  const { guid } = await params;

  const contactPromise = getContactDetails(guid);
  const contactLogsPromise = contactPromise.then((c) =>
    c.Contact_ID ? getContactLogsByContactId(c.Contact_ID) : []
  );
  const mpTimezone = await getMpTimezone();

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
          mpTimezone={mpTimezone}
        />
      </Suspense>
    </div>
  );
}
