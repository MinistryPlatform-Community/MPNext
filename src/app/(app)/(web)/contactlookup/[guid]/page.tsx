import { ContactLookupDetails, ContactLookupDetailsEditEmail } from "@/components/contact-lookup-details";

interface ContactLookupDetailPageProps {
  params: Promise<{
    guid: string;
  }>;
}

export default async function ContactLookupDetailPage({
  params,
}: ContactLookupDetailPageProps) {
  const { guid } = await params;

  return (
    <div className="container mx-auto p-4 space-y-6">
      <ContactLookupDetails guid={guid} />
      <ContactLookupDetailsEditEmail guid={guid} />
    </div>
  );
}
