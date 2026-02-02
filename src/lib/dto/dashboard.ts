/**
 * Represents metrics for a specific time period
 */
export interface PeriodMetrics {
  periodStart: string; // ISO date
  periodEnd: string; // ISO date
  averageAttendance: number;
  averageInPersonAttendance: number;
  averageOnlineAttendance: number;
  uniqueAttendees: number;
  uniqueInPersonAttendees: number;
  uniqueOnlineAttendees: number;
  totalEvents: number;
}

/**
 * Group participation metrics by group type
 */
export interface GroupTypeMetrics {
  groupTypeId: number;
  groupTypeName: string;
  activeGroupCount: number;
  totalParticipants: number;
  uniqueParticipants: number;
  averageGroupSize: number;
}

/**
 * Year-over-year comparison data
 */
export interface YearOverYearMetrics {
  metric: string; // e.g., "Sunday Morning Attendance"
  currentYear: number;
  previousYear: number;
  percentageChange: number;
  trend: 'up' | 'down' | 'stable';
}

/**
 * Event attendance metrics by event type
 */
export interface EventTypeMetrics {
  eventTypeId: number;
  eventTypeName: string;
  eventCount: number;
  averageAttendance: number;
  averageInPersonAttendance: number;
  averageOnlineAttendance: number;
  uniqueAttendees: number;
  uniqueInPersonAttendees: number;
  uniqueOnlineAttendees: number;
  totalAttendance: number;
  totalInPersonAttendance: number;
  totalOnlineAttendance: number;
}

/**
 * Small group trend data (monthly aggregation)
 */
export interface SmallGroupTrend {
  month: string; // YYYY-MM
  activeGroupCount: number;
  totalParticipants: number;
  averageAttendance: number;
}

/**
 * Community attendance trend data (weekly Sunday gatherings)
 */
export interface CommunityAttendanceTrend {
  weekStartDate: string; // ISO date for the week start (Sunday)
  communityAttendance: { [communityName: string]: number }; // Map of community name to average attendance
}

/**
 * Monthly worship service attendance trend data
 */
export interface MonthlyAttendanceTrend {
  month: string; // YYYY-MM
  monthName: string; // e.g., "September"
  averageInPersonAttendance: number;
  averageOnlineAttendance: number;
  averageTotalAttendance: number;
  eventCount: number;
}

/**
 * Complete dashboard data
 */
export interface DashboardData {
  currentPeriod: PeriodMetrics;
  previousPeriod: PeriodMetrics;
  groupTypeMetrics: GroupTypeMetrics[];
  eventTypeMetrics: EventTypeMetrics[];
  yearOverYear: YearOverYearMetrics[];
  smallGroupTrends: SmallGroupTrend[];
  communityAttendanceTrends: CommunityAttendanceTrend[];
  monthlyAttendanceTrends: MonthlyAttendanceTrend[];
  previousYearMonthlyAttendanceTrends: MonthlyAttendanceTrend[];
  baptismsLastYear: number;
  baptismsPreviousYear: number;
  generatedAt: string;
}
