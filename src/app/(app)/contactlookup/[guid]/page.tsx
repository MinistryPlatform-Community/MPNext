import { ContactLookupDetails } from "@/components/contact-lookup-details/contact-lookup-details";

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
    <div className="container mx-auto p-4">
      <ContactLookupDetails guid={guid} />
    </div>
  );
}
