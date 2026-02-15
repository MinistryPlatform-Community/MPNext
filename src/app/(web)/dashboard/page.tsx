import { getFullRangeDashboardMetrics } from '@/components/dashboard/actions';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';

const BUILD_ID = 'client-side-filter-v1';

export default async function DashboardPage() {

  // Fetch full date range on server; client-side filtering handles date selection
  const dashboardData = await getFullRangeDashboardMetrics();

  return (
    <div className="container mx-auto p-8">
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 rounded-md border border-blue-300 bg-blue-50 px-4 py-2 text-xs text-blue-800 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-200">
          <strong>Build:</strong> {BUILD_ID} | <strong>Branch:</strong> claude/review-date-filter-UfQYm | <strong>Rendered:</strong> {new Date().toISOString()}
        </div>
      )}
      <DashboardShell initialData={dashboardData} />
    </div>
  );
}
