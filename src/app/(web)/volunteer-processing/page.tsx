import { VolunteerProcessing } from '@/components/volunteer-processing';

interface VolunteerProcessingPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function VolunteerProcessingPage({ searchParams }: VolunteerProcessingPageProps) {
  const params = await searchParams;
  const volunteerParam = typeof params.volunteer === 'string' ? Number(params.volunteer) : null;
  const initialVolunteerId = volunteerParam && !isNaN(volunteerParam) ? volunteerParam : null;

  return (
    <div className="container mx-auto p-8">
      <VolunteerProcessing initialVolunteerId={initialVolunteerId} />
    </div>
  );
}
