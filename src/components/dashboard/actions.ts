'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { DashboardService } from '@/services/dashboardService';
import { DashboardData } from '@/lib/dto';

/**
 * Fetches dashboard data for the specified ministry year
 * Defaults to current ministry year (Sept - May)
 *
 * @param year - Optional ministry year (defaults to current)
 * @returns Promise<DashboardData> - Complete dashboard metrics
 */
export async function getDashboardMetrics(
  year?: number
): Promise<DashboardData> {
  try {
    const currentYear = year || getCurrentMinistryYear();

    // Ministry year runs Sept 1 - May 31
    const startDate = new Date(currentYear, 8, 1); // September 1
    const endDate = new Date(currentYear + 1, 4, 31); // May 31 of next calendar year

    const dashboardService = await DashboardService.getInstance();
    const data = await dashboardService.getDashboardData(startDate, endDate);

    return data;
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    throw new Error('Failed to fetch dashboard metrics');
  }
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
 * This action revalidates both page-level and query-level caches:
 * - Page-level: revalidates the dashboard page
 * - Query-level: invalidates Group_Types and Event_Types caches
 *
 * @returns Promise<{ success: boolean; timestamp: Date }>
 */
export async function refreshDashboardCache(): Promise<{
  success: boolean;
  timestamp: Date;
}> {
  try {
    revalidatePath('/dashboard');
    revalidateTag('group-types');
    revalidateTag('event-types');
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
