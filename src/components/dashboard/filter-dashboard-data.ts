import {
  DashboardData,
  PeriodMetrics,
  MonthlyAttendanceTrend,
  SmallGroupTrend,
  YearOverYearMetrics,
  WeeklyAttendanceTrend,
  CommunityAttendanceTrend,
} from '@/lib/dto';
import {
  DateRangeSelection,
  selectionToDateRange,
  getPreviousPeriodRange,
} from './date-range-filter';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/** Derive monthName from YYYY-MM if missing (handles stale cached data) */
function ensureMonthName(item: SmallGroupTrend): SmallGroupTrend {
  if (item.monthName) return item;
  const [, m] = item.month.split('-').map(Number);
  return { ...item, monthName: MONTH_NAMES[m - 1] };
}

/**
 * Detect whether the selection represents a single month in a single year.
 * When true, charts should show weekly (per-date) data points instead of monthly averages.
 */
export function isSingleMonthSelection(selection: DateRangeSelection): boolean {
  return selection.months.length === 1 && selection.years.length === 1;
}

/**
 * Filters the full-range dashboard data to match the user's date selection.
 * Runs entirely client-side — no server round-trip needed.
 *
 * Time-series data (monthly attendance, community attendance, small group trends)
 * is filtered by date. Aggregate metrics (PeriodMetrics, YearOverYear) are
 * recomputed from the filtered monthly data. Non-time-series data (groupTypeMetrics,
 * eventTypeMetrics, baptisms) is passed through unchanged.
 *
 * When a single month is selected, weekly (per-date) data points are substituted
 * for monthly averages so charts show individual data points for that month.
 */
export function filterDashboardData(
  fullData: DashboardData,
  selection: DateRangeSelection
): DashboardData {
  const { startDate, endDate } = selectionToDateRange(selection);
  const singleMonth = isSingleMonthSelection(selection);

  // Filter time-series arrays by the selected date range
  let monthlyAttendanceTrends = filterMonthlyTrends(
    fullData.monthlyAttendanceTrends,
    startDate,
    endDate
  );

  let communityAttendanceTrends = fullData.communityAttendanceTrends.filter(week => {
    const [y, m, d] = week.weekStartDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date >= startDate && date <= endDate;
  });

  const smallGroupTrends = filterMonthlyByDate(
    fullData.smallGroupTrends,
    startDate,
    endDate
  ).map(ensureMonthName);

  // Compute previous period trends for comparison
  const { startDate: prevStart, endDate: prevEnd } = getPreviousPeriodRange(startDate, endDate);
  let previousYearMonthlyAttendanceTrends = filterMonthlyTrends(
    fullData.monthlyAttendanceTrends,
    prevStart,
    prevEnd
  );
  const previousYearSmallGroupTrends = filterMonthlyByDate(
    fullData.smallGroupTrends,
    prevStart,
    prevEnd
  ).map(ensureMonthName);

  // When a single month is selected, substitute weekly data for monthly averages
  // so charts show individual data points instead of one aggregated value
  if (singleMonth) {
    const weeklyFiltered = filterWeeklyTrends(
      fullData.weeklyAttendanceTrends,
      startDate,
      endDate
    );

    // Convert weekly attendance data to MonthlyAttendanceTrend format
    // so the chart component can render it without changes to its interface
    monthlyAttendanceTrends = weeklyFiltered.map(w => ({
      month: w.eventDate,
      monthName: w.dateLabel,
      averageInPersonAttendance: w.inPersonAttendance,
      averageOnlineAttendance: w.onlineAttendance,
      averageTotalAttendance: w.totalAttendance,
      eventCount: w.eventCount
    }));

    // Use weekly community data for the selected month
    communityAttendanceTrends = filterCommunityByDateRange(
      fullData.weeklyCommunityAttendanceTrends,
      startDate,
      endDate
    );

    // Previous year weekly data for comparison
    const prevWeeklyFiltered = filterWeeklyTrends(
      fullData.weeklyAttendanceTrends,
      prevStart,
      prevEnd
    );
    previousYearMonthlyAttendanceTrends = prevWeeklyFiltered.map(w => ({
      month: w.eventDate,
      monthName: w.dateLabel,
      averageInPersonAttendance: w.inPersonAttendance,
      averageOnlineAttendance: w.onlineAttendance,
      averageTotalAttendance: w.totalAttendance,
      eventCount: w.eventCount
    }));
  }

  // Recompute aggregate PeriodMetrics from filtered monthly data
  const currentPeriod = computePeriodMetrics(monthlyAttendanceTrends, startDate, endDate);
  const previousPeriod = computePeriodMetrics(previousYearMonthlyAttendanceTrends, prevStart, prevEnd);

  // Recompute year-over-year from the recomputed period metrics
  const yearOverYear = computeYearOverYear(currentPeriod, previousPeriod);

  return {
    ...fullData,
    currentPeriod,
    previousPeriod,
    monthlyAttendanceTrends,
    previousYearMonthlyAttendanceTrends,
    communityAttendanceTrends,
    smallGroupTrends,
    previousYearSmallGroupTrends,
    yearOverYear,
    // groupTypeMetrics, eventTypeMetrics, baptisms — pass through from full range
  };
}

/** Filter WeeklyAttendanceTrend[] by date range (eventDate is YYYY-MM-DD) */
function filterWeeklyTrends(
  trends: WeeklyAttendanceTrend[],
  startDate: Date,
  endDate: Date
): WeeklyAttendanceTrend[] {
  return trends.filter(t => {
    const [y, m, d] = t.eventDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date >= startDate && date <= endDate;
  });
}

/** Filter CommunityAttendanceTrend[] by date range (weekStartDate is YYYY-MM-DD) */
function filterCommunityByDateRange(
  trends: CommunityAttendanceTrend[],
  startDate: Date,
  endDate: Date
): CommunityAttendanceTrend[] {
  return trends.filter(t => {
    const [y, m, d] = t.weekStartDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date >= startDate && date <= endDate;
  });
}

/** Filter MonthlyAttendanceTrend[] by date range (month field is YYYY-MM) */
function filterMonthlyTrends(
  trends: MonthlyAttendanceTrend[],
  startDate: Date,
  endDate: Date
): MonthlyAttendanceTrend[] {
  return trends.filter(t => {
    const [y, m] = t.month.split('-').map(Number);
    const date = new Date(y, m - 1, 1);
    return date >= new Date(startDate.getFullYear(), startDate.getMonth(), 1) &&
           date <= new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  });
}

/** Filter any array with a `month` field (YYYY-MM) by date range */
function filterMonthlyByDate<T extends { month: string }>(
  items: T[],
  startDate: Date,
  endDate: Date
): T[] {
  return items.filter(item => {
    const [y, m] = item.month.split('-').map(Number);
    const date = new Date(y, m - 1, 1);
    return date >= new Date(startDate.getFullYear(), startDate.getMonth(), 1) &&
           date <= new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  });
}

/**
 * Compute PeriodMetrics from filtered monthly attendance data.
 * Uses weighted averages (by event count) for attendance figures.
 */
function computePeriodMetrics(
  monthly: MonthlyAttendanceTrend[],
  startDate: Date,
  endDate: Date
): PeriodMetrics {
  if (monthly.length === 0) {
    return {
      periodStart: startDate.toISOString(),
      periodEnd: endDate.toISOString(),
      averageAttendance: 0,
      averageInPersonAttendance: 0,
      averageOnlineAttendance: 0,
      uniqueAttendees: 0,
      uniqueInPersonAttendees: 0,
      uniqueOnlineAttendees: 0,
      totalEvents: 0,
    };
  }

  const totalEvents = monthly.reduce((sum, m) => sum + m.eventCount, 0);

  // Weighted average: sum(monthAvg * monthEventCount) / totalEvents
  const avgInPerson = totalEvents > 0
    ? Math.round(monthly.reduce((sum, m) => sum + m.averageInPersonAttendance * m.eventCount, 0) / totalEvents)
    : 0;
  const avgOnline = totalEvents > 0
    ? Math.round(monthly.reduce((sum, m) => sum + m.averageOnlineAttendance * m.eventCount, 0) / totalEvents)
    : 0;
  const avgTotal = totalEvents > 0
    ? Math.round(monthly.reduce((sum, m) => sum + m.averageTotalAttendance * m.eventCount, 0) / totalEvents)
    : 0;

  return {
    periodStart: startDate.toISOString(),
    periodEnd: endDate.toISOString(),
    averageAttendance: avgTotal,
    averageInPersonAttendance: avgInPerson,
    averageOnlineAttendance: avgOnline,
    uniqueAttendees: 0, // Not derivable from monthly averages
    uniqueInPersonAttendees: 0,
    uniqueOnlineAttendees: 0,
    totalEvents,
  };
}

/** Compute year-over-year comparison metrics from current and previous period */
function computeYearOverYear(
  current: PeriodMetrics,
  previous: PeriodMetrics
): YearOverYearMetrics[] {
  const pctChange = (cur: number, prev: number): number => {
    if (prev === 0) return cur > 0 ? 100 : 0;
    return Math.round(((cur - prev) / prev) * 100);
  };

  const trend = (cur: number, prev: number): 'up' | 'down' | 'stable' => {
    const change = pctChange(cur, prev);
    if (change > 2) return 'up';
    if (change < -2) return 'down';
    return 'stable';
  };

  return [
    {
      metric: 'Average Attendance',
      currentYear: current.averageAttendance,
      previousYear: previous.averageAttendance,
      percentageChange: pctChange(current.averageAttendance, previous.averageAttendance),
      trend: trend(current.averageAttendance, previous.averageAttendance),
    },
    {
      metric: 'Total Events',
      currentYear: current.totalEvents,
      previousYear: previous.totalEvents,
      percentageChange: pctChange(current.totalEvents, previous.totalEvents),
      trend: trend(current.totalEvents, previous.totalEvents),
    },
    {
      metric: 'Avg In-Person',
      currentYear: current.averageInPersonAttendance,
      previousYear: previous.averageInPersonAttendance,
      percentageChange: pctChange(current.averageInPersonAttendance, previous.averageInPersonAttendance),
      trend: trend(current.averageInPersonAttendance, previous.averageInPersonAttendance),
    },
    {
      metric: 'Avg Online',
      currentYear: current.averageOnlineAttendance,
      previousYear: previous.averageOnlineAttendance,
      percentageChange: pctChange(current.averageOnlineAttendance, previous.averageOnlineAttendance),
      trend: trend(current.averageOnlineAttendance, previous.averageOnlineAttendance),
    },
  ];
}
