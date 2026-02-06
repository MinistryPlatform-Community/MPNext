import { getDashboardMetrics } from '@/components/dashboard/actions';
import { DashboardMetrics } from '@/components/dashboard/dashboard-metrics';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';

// Revalidate the dashboard data every 6 hours (21600 seconds)
// This provides 4 refresh windows per day: 12am, 6am, 12pm, 6pm
export const revalidate = 21600;

// Use dynamic rendering with ISR (Incremental Static Regeneration)
// Page will be rendered on first request, then cached for 6 hours
// This allows the build to succeed without needing API access at build time
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // Fetch data on server
  const dashboardData = await getDashboardMetrics();

  return (
    <div className="container mx-auto p-8 space-y-8">
      <DashboardHeader />

      {/* Pass data to client component for rendering */}
      <DashboardMetrics data={dashboardData} />
    </div>
  );
}
