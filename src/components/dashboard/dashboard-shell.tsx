'use client';

import { useState, useTransition, useCallback, useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardData } from '@/lib/dto';
import { DashboardMetrics } from './dashboard-metrics';
import {
  DateRangeFilter,
  DateRangeSelection,
  getDefaultSelection,
  selectionToDateRange,
} from './date-range-filter';
import { refreshDashboardCache, getFullRangeDashboardMetrics } from './actions';
import { filterDashboardData, isSingleMonthSelection } from './filter-dashboard-data';
import { useRouter } from 'next/navigation';

interface DashboardShellProps {
  /** Full-range data loaded server-side, filtered client-side on selection change */
  initialData: DashboardData;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/** Format the selected date range as a human-readable description */
function formatSelectionDescription(selection: DateRangeSelection): string {
  const { startDate, endDate } = selectionToDateRange(selection);
  const startMonth = MONTH_NAMES[startDate.getMonth()];
  const endMonth = MONTH_NAMES[endDate.getMonth()];
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();

  if (startYear === endYear) {
    if (startDate.getMonth() === endDate.getMonth()) {
      return `${startMonth} ${startYear}`;
    }
    return `${startMonth} - ${endMonth} ${startYear}`;
  }
  return `${startMonth} ${startYear} - ${endMonth} ${endYear}`;
}

export function DashboardShell({ initialData }: DashboardShellProps) {
  const router = useRouter();
  const [selection, setSelection] = useState<DateRangeSelection>(getDefaultSelection);
  const [fullData, setFullData] = useState<DashboardData>(initialData);
  const [isRefreshing, startRefreshTransition] = useTransition();
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const description = useMemo(() => formatSelectionDescription(selection), [selection]);

  // Client-side filtering: derive the displayed data from the full dataset + selection
  const filteredData = useMemo(
    () => filterDashboardData(fullData, selection),
    [fullData, selection]
  );

  const handleSelectionChange = useCallback(
    (newSelection: DateRangeSelection) => {
      setSelection(newSelection);
      // No server call — filteredData is recomputed via useMemo
    },
    []
  );

  const handleRefresh = useCallback(() => {
    startRefreshTransition(async () => {
      const cacheResult = await refreshDashboardCache();
      if (cacheResult.success) {
        setLastRefresh(cacheResult.timestamp);
      }

      // Re-fetch full range data from server
      const freshData = await getFullRangeDashboardMetrics();
      setFullData(freshData);
      router.refresh();
    });
  }, [router]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold tracking-tight">Executive Dashboard</h1>
          <div className="flex items-center gap-2">
            {lastRefresh && (
              <p className="text-xs text-muted-foreground">
                Last refreshed: {lastRefresh.toLocaleTimeString()}
              </p>
            )}
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
            </Button>
          </div>
        </div>

        <p className="text-muted-foreground">
          Worship Services attendance and group participation metrics for {description}
        </p>

        {/* Date Range Filter */}
        <DateRangeFilter
          selection={selection}
          onSelectionChange={handleSelectionChange}
          disabled={isRefreshing}
        />
      </div>

      {/* Dashboard Content */}
      <div className={isRefreshing ? 'opacity-60 pointer-events-none transition-opacity' : 'transition-opacity'}>
        <DashboardMetrics data={filteredData} showCompare={selection.compare} isSingleMonth={isSingleMonthSelection(selection)} />
      </div>
    </div>
  );
}
