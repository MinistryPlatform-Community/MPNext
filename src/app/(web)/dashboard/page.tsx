import { getDashboardMetrics } from '@/components/dashboard/actions';
import { DashboardMetrics } from '@/components/dashboard/dashboard-metrics';

// Revalidate the dashboard data every hour (3600 seconds)
export const revalidate = 3600;

export default async function DashboardPage() {
  // Fetch data on server
  const dashboardData = await getDashboardMetrics();

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Executive Dashboard</h1>
        <p className="text-muted-foreground">
          Worship Services attendance and group participation metrics for ministry year (September - May)
        </p>
      </div>

      {/* Pass data to client component for rendering */}
      <DashboardMetrics data={dashboardData} />
    </div>
  );
}
