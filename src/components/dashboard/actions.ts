'use server';

import { unstable_cache, revalidatePath, revalidateTag } from 'next/cache';
import { DashboardService } from '@/services/dashboardService';
import { DashboardData } from '@/lib/dto';

/**
 * Cached dashboard data for a single ministry year (6-hour cache)
 */
const getCachedDashboardData = (ministryYear: number) =>
  unstable_cache(
    async (): Promise<DashboardData> => {
      // Ministry year runs Sept 1 - Aug 31
      const startDate = new Date(ministryYear, 8, 1); // September 1
      const endDate = new Date(ministryYear + 1, 7, 31); // August 31 of next calendar year

      const dashboardService = await DashboardService.getInstance();
      return dashboardService.getDashboardData(startDate, endDate);
    },
    [`dashboard-data-${ministryYear}`],
    { revalidate: 21600, tags: ['dashboard-data', `year-${ministryYear}`] }
  );

/**
 * Cached full-range dashboard data for 5 ministry years (6-hour cache)
 */
const getCachedFullRangeData = (earliestYear: number, currentYear: number) =>
  unstable_cache(
    async (): Promise<DashboardData> => {
      const startDate = new Date(earliestYear, 8, 1); // September 1, 5 years ago
      const today = new Date();
      // Use today or Aug 31 of current+1, whichever is earlier
      const maxEnd = new Date(currentYear + 1, 7, 31);
      const endDate = today < maxEnd ? today : maxEnd;

      const dashboardService = await DashboardService.getInstance();
      return dashboardService.getDashboardData(startDate, endDate);
    },
    [`dashboard-full-range-${earliestYear}-${currentYear}`],
    { revalidate: 21600, tags: ['dashboard-data', 'dashboard-full-range'] }
  );

/**
 * Fetches dashboard data for the specified ministry year
 * Defaults to current ministry year (Sept - Aug)
 * Data is cached for 6 hours and tagged for manual invalidation
 *
 * @param year - Optional ministry year (defaults to current)
 * @returns Promise<DashboardData> - Complete dashboard metrics
 */
export async function getDashboardMetrics(
  year?: number
): Promise<DashboardData> {
  const currentYear = year || getCurrentMinistryYear();
  return getCachedDashboardData(currentYear)();
}

/**
 * Fetches dashboard data for the full selectable date range (5 ministry years).
 * All data is loaded once and filtered client-side when the user changes the filter.
 * Cached for 6 hours with manual invalidation support.
 *
 * @returns Promise<DashboardData> - Complete dashboard metrics for the full range
 */
export async function getFullRangeDashboardMetrics(): Promise<DashboardData> {
  const currentYear = getCurrentMinistryYear();
  const earliestYear = currentYear - 4;
  return getCachedFullRangeData(earliestYear, currentYear)();
}

/**
 * Determines current ministry year based on today's date
 * If before September, use previous calendar year
 * If September or later, use current calendar year
 *
 * @returns number - Current ministry year
 */
function getCurrentMinistryYear(): number {
  const today = new Date();
  const currentMonth = today.getMonth(); // 0-indexed (0 = Jan, 8 = Sept)

  return currentMonth >= 8
    ? today.getFullYear()
    : today.getFullYear() - 1;
}

/**
 * Manually refreshes the dashboard cache
 * Revalidates both page-level and data-level caches:
 * - Page-level: revalidates the dashboard page
 * - Data-level: invalidates dashboard-data, Group_Types and Event_Types caches
 *
 * @returns Promise<{ success: boolean; timestamp: Date }>
 */
export async function refreshDashboardCache(): Promise<{
  success: boolean;
  timestamp: Date;
}> {
  try {
    revalidatePath('/dashboard');
    revalidateTag('dashboard-data', { expire: 0 });
    revalidateTag('group-types', { expire: 0 });
    revalidateTag('event-types', { expire: 0 });
    return {
      success: true,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Error refreshing dashboard cache:', error);
    return {
      success: false,
      timestamp: new Date()
    };
  }
}
