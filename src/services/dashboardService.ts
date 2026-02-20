import { unstable_cache } from 'next/cache';
import { MPHelper } from '@/lib/providers/ministry-platform';
import {
  DashboardData,
  GroupTypeMetrics,
  EventTypeMetrics,
  PeriodMetrics,
  YearOverYearMetrics,
  SmallGroupTrend,
  MonthlyAttendanceTrend,
  WeeklyAttendanceTrend,
  CommunityAttendanceTrend
} from '@/lib/dto';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Cached Group_Types lookup (24-hour cache)
 */
const getCachedGroupTypes = (ids: string) =>
  unstable_cache(
    async () => {
      const mp = new MPHelper();
      return mp.getTableRecords<{
        Group_Type_ID: number;
        Group_Type: string;
      }>({
        table: 'Group_Types',
        select: 'Group_Type_ID,Group_Type',
        filter: `Group_Type_ID IN (${ids})`
      });
    },
    [`group-types-${ids}`],
    { revalidate: 86400, tags: ['group-types'] }
  );

/**
 * Cached Event_Types lookup (24-hour cache)
 */
const getCachedEventTypes = (ids: string) =>
  unstable_cache(
    async () => {
      const mp = new MPHelper();
      return mp.getTableRecords<{
        Event_Type_ID: number;
        Event_Type: string;
      }>({
        table: 'Event_Types',
        select: 'Event_Type_ID,Event_Type',
        filter: `Event_Type_ID IN (${ids})`
      });
    },
    [`event-types-${ids}`],
    { revalidate: 86400, tags: ['event-types'] }
  );

/**
 * DashboardService - Singleton service for managing dashboard metrics
 *
 * This service provides methods to fetch and aggregate dashboard data from Ministry Platform,
 * including group participation, event attendance, and year-over-year comparisons.
 * Uses the singleton pattern to ensure a single instance across the application.
 */
export class DashboardService {
  private static instance: DashboardService;
  private mp: MPHelper | null = null;

  private constructor() {}

  /**
   * Returns a DashboardService instance.
   * @param accessToken Optional user access token from the OIDC session. When provided,
   *                    creates a per-request instance that authenticates as the logged-in
   *                    user (respecting their MP permissions and producing accurate audit logs).
   *                    When omitted, returns the singleton instance using client credentials.
   *
   * Note: Cached lookups (Group_Types, Event_Types via unstable_cache) always use client
   * credentials since they run outside user request context. The main data queries
   * use the access token when provided.
   */
  public static async getInstance(accessToken?: string): Promise<DashboardService> {
    if (accessToken) {
      const instance = new DashboardService();
      instance.mp = new MPHelper({ accessToken });
      return instance;
    }
    if (!DashboardService.instance) {
      DashboardService.instance = new DashboardService();
      DashboardService.instance.mp = new MPHelper();
    }
    return DashboardService.instance;
  }

  /**
   * Gets Group_Types with 24-hour cache via unstable_cache
   */
  private async getGroupTypesWithCache(groupTypeIds: Set<number>) {
    const ids = Array.from(groupTypeIds).sort().join(',');
    return getCachedGroupTypes(ids)();
  }

  /**
   * Gets Event_Types with 24-hour cache via unstable_cache
   */
  private async getEventTypesWithCache(eventTypeIds: Set<number>) {
    const ids = Array.from(eventTypeIds).sort().join(',');
    return getCachedEventTypes(ids)();
  }

  /**
   * Gets complete dashboard data for current and previous ministry years
   *
   * @param currentYearStart - Start date of current ministry year
   * @param currentYearEnd - End date of current ministry year
   * @returns Promise<DashboardData> - Complete dashboard metrics
   */
  public async getDashboardData(
    currentYearStart: Date,
    currentYearEnd: Date
  ): Promise<DashboardData> {
    // Calculate previous period dates (one year earlier)
    const previousYearStart = new Date(currentYearStart);
    previousYearStart.setFullYear(previousYearStart.getFullYear() - 1);
    const previousYearEnd = new Date(currentYearEnd);
    previousYearEnd.setFullYear(previousYearEnd.getFullYear() - 1);

    // Calculate baptisms date ranges (last 365 days from today)
    const today = new Date();
    const currentBaptismsStart = new Date(today);
    currentBaptismsStart.setFullYear(today.getFullYear() - 1);
    const previousBaptismsEnd = new Date(currentBaptismsStart);
    previousBaptismsEnd.setDate(previousBaptismsEnd.getDate() - 1);
    const previousBaptismsStart = new Date(previousBaptismsEnd);
    previousBaptismsStart.setFullYear(previousBaptismsEnd.getFullYear() - 1);

    // Fetch all metrics in parallel for better performance
    const [
      currentPeriod,
      previousPeriod,
      groupTypeMetrics,
      eventTypeMetrics,
      smallGroupTrends,
      communityTrends,
      monthlyAttendanceTrends,
      previousYearMonthlyAttendanceTrends,
      weeklyAttendanceTrends,
      baptismsLastYear,
      baptismsPreviousYear
    ] = await Promise.all([
      this.getPeriodMetrics(currentYearStart, currentYearEnd),
      this.getPeriodMetrics(previousYearStart, previousYearEnd),
      this.getGroupTypeMetrics(currentYearStart, currentYearEnd),
      this.getEventTypeMetrics(currentYearStart, currentYearEnd),
      this.getSmallGroupTrends(currentYearStart, currentYearEnd),
      this.getCommunityAttendanceTrends(currentYearStart, currentYearEnd),
      this.getMonthlyAttendanceTrends(currentYearStart, currentYearEnd),
      this.getMonthlyAttendanceTrends(previousYearStart, previousYearEnd),
      this.getWeeklyAttendanceTrends(currentYearStart, currentYearEnd),
      this.getBaptismsCount(currentBaptismsStart, today),
      this.getBaptismsCount(previousBaptismsStart, previousBaptismsEnd)
    ]);

    // Calculate year-over-year comparisons
    const yearOverYear = this.calculateYearOverYear(
      currentPeriod,
      previousPeriod,
      groupTypeMetrics,
      eventTypeMetrics
    );

    return {
      currentPeriod,
      previousPeriod,
      groupTypeMetrics,
      eventTypeMetrics,
      yearOverYear,
      smallGroupTrends,
      previousYearSmallGroupTrends: [], // Computed client-side by filterDashboardData
      communityAttendanceTrends: communityTrends.monthly,
      monthlyAttendanceTrends,
      previousYearMonthlyAttendanceTrends,
      weeklyAttendanceTrends,
      weeklyCommunityAttendanceTrends: communityTrends.weekly,
      baptismsLastYear,
      baptismsPreviousYear,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Gets group participation metrics by group type
   *
   * @param startDate - Start date of period
   * @param endDate - End date of period
   * @returns Promise<GroupTypeMetrics[]> - Group metrics by type
   */
  private async getGroupTypeMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<GroupTypeMetrics[]> {
    const startIso = startDate.toISOString();
    const endIso = endDate.toISOString();

    try {
      // Step 1: Get active groups for the period
      const groups = await this.mp!.getTableRecords<{
        Group_ID: number;
        Group_Type_ID: number;
      }>({
        table: 'Groups',
        select: 'Group_ID,Group_Type_ID',
        filter: `
          Groups.Start_Date <= '${endIso}' AND
          (Groups.End_Date IS NULL OR Groups.End_Date >= '${startIso}')
        `
      });

      if (groups.length === 0) return [];

      // Step 2: Get all group types to identify which to exclude (cached 24 hours)
      const groupTypeIds = new Set(groups.map(g => g.Group_Type_ID));
      const groupTypes = await this.getGroupTypesWithCache(groupTypeIds);

      // Identify childcare group type IDs
      const childcareTypeIds = new Set(
        groupTypes
          .filter(gt => gt.Group_Type === 'Childcare')
          .map(gt => gt.Group_Type_ID)
      );

      // Filter out childcare groups
      const filteredGroups = groups.filter(g => !childcareTypeIds.has(g.Group_Type_ID));
      const activeGroupIds = new Set(filteredGroups.map(g => g.Group_ID));
      if (activeGroupIds.size === 0) return [];

      // Filter out childcare from group types
      const filteredGroupTypes = groupTypes.filter(gt => gt.Group_Type !== 'Childcare');
      const groupTypeMap = new Map(filteredGroupTypes.map(gt => [gt.Group_Type_ID, gt.Group_Type]));
      const groupToTypeMap = new Map(filteredGroups.map(g => [g.Group_ID, g.Group_Type_ID]));

      // Step 3: Get group participants for active groups
      const groupParticipants = await this.mp!.getTableRecords<{
        Group_Participant_ID: number;
        Group_ID: number;
        Participant_ID: number;
      }>({
        table: 'Group_Participants',
        select: 'Group_Participant_ID,Group_ID,Participant_ID',
        filter: `
          Group_Participants.Group_ID IN (${Array.from(activeGroupIds).join(',')}) AND
          Group_Participants.Start_Date <= '${endIso}' AND
          (Group_Participants.End_Date IS NULL OR Group_Participants.End_Date >= '${startIso}')
        `
      });

      // Aggregate by group type
      const metricsMap = new Map<number, {
        groupTypeName: string;
        groupIds: Set<number>;
        participantIds: Set<number>;
        totalParticipants: number;
      }>();

      for (const gp of groupParticipants) {
        const groupTypeId = groupToTypeMap.get(gp.Group_ID);
        if (!groupTypeId) continue;

        const groupTypeName = groupTypeMap.get(groupTypeId) || 'Unknown';

        if (!metricsMap.has(groupTypeId)) {
          metricsMap.set(groupTypeId, {
            groupTypeName,
            groupIds: new Set(),
            participantIds: new Set(),
            totalParticipants: 0
          });
        }

        const metrics = metricsMap.get(groupTypeId)!;
        metrics.groupIds.add(gp.Group_ID);
        metrics.participantIds.add(gp.Participant_ID);
        metrics.totalParticipants++;
      }

      // Convert to array format
      return Array.from(metricsMap.entries()).map(([groupTypeId, metrics]) => ({
        groupTypeId,
        groupTypeName: metrics.groupTypeName,
        activeGroupCount: metrics.groupIds.size,
        totalParticipants: metrics.totalParticipants,
        uniqueParticipants: metrics.participantIds.size,
        averageGroupSize: metrics.groupIds.size > 0
          ? Math.round(metrics.participantIds.size / metrics.groupIds.size)
          : 0
      }));
    } catch (error) {
      console.error('Error fetching group type metrics:', error);
      return [];
    }
  }

  /**
   * Gets event attendance metrics by event type
   *
   * @param startDate - Start date of period
   * @param endDate - End date of period
   * @returns Promise<EventTypeMetrics[]> - Event metrics by type
   */
  private async getEventTypeMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<EventTypeMetrics[]> {
    const startIso = startDate.toISOString();
    const endIso = endDate.toISOString();

    try {
      // Step 1: Get events for the period (Event_Type_ID = 7 for Worship Services)
      const events = await this.mp!.getTableRecords<{
        Event_ID: number;
        Event_Type_ID: number;
      }>({
        table: 'Events',
        select: 'Event_ID,Event_Type_ID',
        filter: `
          Events.Event_Start_Date >= '${startIso}' AND
          Events.Event_End_Date <= '${endIso}' AND
          Events.Cancelled = 0 AND
          Events.Event_Type_ID = 7
        `
      });

      const eventIds = new Set(events.map(e => e.Event_ID));
      if (eventIds.size === 0) return [];

      // Step 2: Get event types (cached 24 hours)
      const eventTypeIds = new Set(events.map(e => e.Event_Type_ID));
      const eventTypes = await this.getEventTypesWithCache(eventTypeIds);

      const eventTypeMap = new Map(eventTypes.map(et => [et.Event_Type_ID, et.Event_Type]));
      const eventToTypeMap = new Map(events.map(e => [e.Event_ID, e.Event_Type_ID]));

      // Step 3: Get attendance metrics from Event_Metrics (Metric_ID 2 = In-Person, 3 = Online)
      const eventMetrics = await this.mp!.getTableRecords<{
        Event_Metric_ID: number;
        Event_ID: number;
        Metric_ID: number;
        Numerical_Value: number;
      }>({
        table: 'Event_Metrics',
        select: 'Event_Metric_ID,Event_ID,Metric_ID,Numerical_Value',
        filter: `
          Event_Metrics.Event_ID IN (${Array.from(eventIds).join(',')}) AND
          Event_Metrics.Metric_ID IN (2, 3)
        `
      });

      // Aggregate by event type with online vs in-person breakdown
      const metricsMap = new Map<number, {
        eventTypeName: string;
        eventIds: Set<number>;
        totalAttendance: number;
        inPersonAttendance: number;
        onlineAttendance: number;
      }>();

      for (const metric of eventMetrics) {
        const eventTypeId = eventToTypeMap.get(metric.Event_ID);
        if (!eventTypeId) continue;

        const eventTypeName = eventTypeMap.get(eventTypeId) || 'Unknown';

        if (!metricsMap.has(eventTypeId)) {
          metricsMap.set(eventTypeId, {
            eventTypeName,
            eventIds: new Set(),
            totalAttendance: 0,
            inPersonAttendance: 0,
            onlineAttendance: 0
          });
        }

        const metrics = metricsMap.get(eventTypeId)!;
        metrics.eventIds.add(metric.Event_ID);

        if (metric.Metric_ID === 2) {
          // In-Person attendance
          metrics.inPersonAttendance += metric.Numerical_Value;
          metrics.totalAttendance += metric.Numerical_Value;
        } else if (metric.Metric_ID === 3) {
          // Online attendance
          metrics.onlineAttendance += metric.Numerical_Value;
          metrics.totalAttendance += metric.Numerical_Value;
        }
      }

      // Convert to array format
      return Array.from(metricsMap.entries()).map(([eventTypeId, metrics]) => ({
        eventTypeId,
        eventTypeName: metrics.eventTypeName,
        eventCount: metrics.eventIds.size,
        totalAttendance: metrics.totalAttendance,
        totalInPersonAttendance: metrics.inPersonAttendance,
        totalOnlineAttendance: metrics.onlineAttendance,
        // Event_Metrics doesn't track individual participants, only headcounts
        uniqueAttendees: 0,
        uniqueInPersonAttendees: 0,
        uniqueOnlineAttendees: 0,
        averageAttendance: metrics.eventIds.size > 0
          ? Math.round(metrics.totalAttendance / metrics.eventIds.size)
          : 0,
        averageInPersonAttendance: metrics.eventIds.size > 0
          ? Math.round(metrics.inPersonAttendance / metrics.eventIds.size)
          : 0,
        averageOnlineAttendance: metrics.eventIds.size > 0
          ? Math.round(metrics.onlineAttendance / metrics.eventIds.size)
          : 0
      }));
    } catch (error) {
      console.error('Error fetching event type metrics:', error);
      return [];
    }
  }

  /**
   * Gets overall period metrics (attendance summary)
   *
   * @param startDate - Start date of period
   * @param endDate - End date of period
   * @returns Promise<PeriodMetrics> - Overall period metrics
   */
  private async getPeriodMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<PeriodMetrics> {
    const startIso = startDate.toISOString();
    const endIso = endDate.toISOString();

    try {
      // Step 1: Get events for the period (Event_Type_ID = 7 for Worship Services)
      const events = await this.mp!.getTableRecords<{
        Event_ID: number;
      }>({
        table: 'Events',
        select: 'Event_ID',
        filter: `
          Events.Event_Start_Date >= '${startIso}' AND
          Events.Event_End_Date <= '${endIso}' AND
          Events.Cancelled = 0 AND
          Events.Event_Type_ID = 7
        `
      });

      const eventIds = new Set(events.map(e => e.Event_ID));

      if (eventIds.size === 0) {
        return {
          periodStart: startIso,
          periodEnd: endIso,
          averageAttendance: 0,
          averageInPersonAttendance: 0,
          averageOnlineAttendance: 0,
          uniqueAttendees: 0,
          uniqueInPersonAttendees: 0,
          uniqueOnlineAttendees: 0,
          totalEvents: 0
        };
      }

      // Step 2: Get attendance metrics from Event_Metrics (Metric_ID 2 = In-Person, 3 = Online)
      const eventMetrics = await this.mp!.getTableRecords<{
        Event_Metric_ID: number;
        Event_ID: number;
        Metric_ID: number;
        Numerical_Value: number;
      }>({
        table: 'Event_Metrics',
        select: 'Event_Metric_ID,Event_ID,Metric_ID,Numerical_Value',
        filter: `
          Event_Metrics.Event_ID IN (${Array.from(eventIds).join(',')}) AND
          Event_Metrics.Metric_ID IN (2, 3)
        `
      });

      // Aggregate metrics and track which events have metrics
      let totalInPerson = 0;
      let totalOnline = 0;
      const eventsWithMetrics = new Set<number>();

      for (const metric of eventMetrics) {
        eventsWithMetrics.add(metric.Event_ID);

        if (metric.Metric_ID === 2) {
          // In-Person attendance (Metric_ID = 2)
          totalInPerson += metric.Numerical_Value;
        } else if (metric.Metric_ID === 3) {
          // Online attendance (Metric_ID = 3)
          totalOnline += metric.Numerical_Value;
        }
      }

      // Only count events that have metrics recorded
      const totalEvents = eventsWithMetrics.size;
      const totalAttendance = totalInPerson + totalOnline;

      return {
        periodStart: startIso,
        periodEnd: endIso,
        totalEvents,
        averageAttendance: totalEvents > 0
          ? Math.round(totalAttendance / totalEvents)
          : 0,
        averageInPersonAttendance: totalEvents > 0
          ? Math.round(totalInPerson / totalEvents)
          : 0,
        averageOnlineAttendance: totalEvents > 0
          ? Math.round(totalOnline / totalEvents)
          : 0,
        // Note: Event_Metrics doesn't track individual participants, only headcounts
        uniqueAttendees: 0,
        uniqueInPersonAttendees: 0,
        uniqueOnlineAttendees: 0
      };
    } catch (error) {
      console.error('Error fetching period metrics:', error);
      return {
        periodStart: startIso,
        periodEnd: endIso,
        averageAttendance: 0,
        averageInPersonAttendance: 0,
        averageOnlineAttendance: 0,
        uniqueAttendees: 0,
        uniqueInPersonAttendees: 0,
        uniqueOnlineAttendees: 0,
        totalEvents: 0
      };
    }
  }

  /**
   * Gets small group trends over time (monthly aggregation)
   *
   * @param startDate - Start date of period
   * @param endDate - End date of period
   * @returns Promise<SmallGroupTrend[]> - Monthly trend data
   */
  /**
   * Gets small group trends optimized to fetch all data once and aggregate by month
   * Reduces API calls from 27 (9 months × 3 queries) to 3 queries total
   *
   * @param startDate - Start date of period
   * @param endDate - End date of period
   * @returns Promise<SmallGroupTrend[]> - Monthly small group participation trends
   */
  private async getSmallGroupTrends(
    startDate: Date,
    endDate: Date
  ): Promise<SmallGroupTrend[]> {
    const startIso = startDate.toISOString();
    const endIso = endDate.toISOString();

    try {
      // Step 1: Get all active groups for the entire period (1 query)
      const groups = await this.mp!.getTableRecords<{
        Group_ID: number;
        Group_Type_ID: number;
        Start_Date: string;
        End_Date: string | null;
      }>({
        table: 'Groups',
        select: 'Group_ID,Group_Type_ID,Start_Date,End_Date',
        filter: `
          Groups.Start_Date <= '${endIso}' AND
          (Groups.End_Date IS NULL OR Groups.End_Date >= '${startIso}')
        `
      });

      if (groups.length === 0) return [];

      // Step 2: Get all group types to identify small groups (cached 24 hours)
      const groupTypeIds = new Set(groups.map(g => g.Group_Type_ID));
      const groupTypes = await this.getGroupTypesWithCache(groupTypeIds);

      // Filter for small groups and create lookup maps
      const smallGroupTypeIds = new Set(
        groupTypes
          .filter(gt =>
            gt.Group_Type.toLowerCase().includes('small') ||
            gt.Group_Type.toLowerCase().includes('life') ||
            gt.Group_Type.toLowerCase().includes('community')
          )
          .map(gt => gt.Group_Type_ID)
      );

      const smallGroups = groups.filter(g => smallGroupTypeIds.has(g.Group_Type_ID));
      const smallGroupIds = new Set(smallGroups.map(g => g.Group_ID));

      if (smallGroupIds.size === 0) return [];

      // Step 3: Get all group participants for the entire period (1 query)
      const groupParticipants = await this.mp!.getTableRecords<{
        Group_Participant_ID: number;
        Group_ID: number;
        Participant_ID: number;
        Start_Date: string;
        End_Date: string | null;
      }>({
        table: 'Group_Participants',
        select: 'Group_Participant_ID,Group_ID,Participant_ID,Start_Date,End_Date',
        filter: `
          Group_Participants.Group_ID IN (${Array.from(smallGroupIds).join(',')}) AND
          Group_Participants.Start_Date <= '${endIso}' AND
          (Group_Participants.End_Date IS NULL OR Group_Participants.End_Date >= '${startIso}')
        `
      });

      // Create a map of group ID to group info for quick lookup
      const groupMap = new Map(smallGroups.map(g => [g.Group_ID, g]));

      // Step 4: Aggregate by month in JavaScript
      const trends: SmallGroupTrend[] = [];
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        // Filter groups and participants active during this month
        const activeGroupsThisMonth = new Set<number>();
        const activeParticipantsThisMonth = new Set<number>();

        for (const gp of groupParticipants) {
          const group = groupMap.get(gp.Group_ID);
          if (!group) continue;

          const gpStart = new Date(gp.Start_Date);
          const gpEnd = gp.End_Date ? new Date(gp.End_Date) : null;
          const groupStart = new Date(group.Start_Date);
          const groupEnd = group.End_Date ? new Date(group.End_Date) : null;

          // Check if group participant was active during this month
          const isGpActive = gpStart <= monthEnd && (!gpEnd || gpEnd >= monthStart);
          const isGroupActive = groupStart <= monthEnd && (!groupEnd || groupEnd >= monthStart);

          if (isGpActive && isGroupActive) {
            activeGroupsThisMonth.add(gp.Group_ID);
            activeParticipantsThisMonth.add(gp.Participant_ID);
          }
        }

        trends.push({
          month: `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`,
          monthName: MONTH_NAMES[currentDate.getMonth()],
          activeGroupCount: activeGroupsThisMonth.size,
          totalParticipants: activeParticipantsThisMonth.size,
          averageAttendance: activeGroupsThisMonth.size > 0
            ? Math.round(activeParticipantsThisMonth.size / activeGroupsThisMonth.size)
            : 0
        });

        // Move to next month
        currentDate.setMonth(currentDate.getMonth() + 1);
      }

      return trends;
    } catch (error) {
      console.error('Error fetching small group trends:', error);
      return [];
    }
  }

  /**
   * Gets community attendance trends over time (both monthly and weekly aggregations)
   * Counts Event_Participants with status 3 or 4, filtered by:
   * - Groups with Group_Type_ID = 11 (Community)
   * - Events within ministry year date range
   *
   * @param startDate - Start date of period
   * @param endDate - End date of period
   * @returns Monthly and weekly community attendance data from the same raw data
   */
  private async getCommunityAttendanceTrends(
    startDate: Date,
    endDate: Date
  ): Promise<{ monthly: CommunityAttendanceTrend[]; weekly: CommunityAttendanceTrend[] }> {
    try {
      // Step 1: Get all Community groups (Group_Type_ID = 11)
      const communityGroups = await this.mp!.getTableRecords<{
        Group_ID: number;
        Group_Name: string;
      }>({
        table: 'Groups',
        select: 'Group_ID,Group_Name',
        filter: `Group_Type_ID = 11`
      });

      if (communityGroups.length === 0) {
        console.log('No Community groups found (Group_Type_ID = 11)');
        return { monthly: [], weekly: [] };
      }

      const communityGroupIds = communityGroups.map(g => g.Group_ID);
      const communityNameMap = new Map(communityGroups.map(g => [g.Group_ID, g.Group_Name]));

      console.log(`Found ${communityGroups.length} Community groups`);

      // Step 2: Get Event_Participants for community groups with status 3 or 4 (Present)
      const eventParticipants = await this.mp!.getTableRecords<{
        Event_Participant_ID: number;
        Event_ID: number;
        Group_ID: number;
        Participation_Status_ID: number;
      }>({
        table: 'Event_Participants',
        select: 'Event_Participant_ID,Event_ID,Group_ID,Participation_Status_ID',
        filter: `Event_Participants.Group_ID IN (${communityGroupIds.join(',')}) AND Event_Participants.Participation_Status_ID IN (3, 4)`
      });

      console.log(`Found ${eventParticipants.length} event participants for community groups`);

      if (eventParticipants.length === 0) return { monthly: [], weekly: [] };

      // Get unique Event_IDs from participants
      const uniqueEventIds = Array.from(new Set(eventParticipants.map(p => p.Event_ID)));

      // Step 3: Get Event details for those Event_IDs (to get dates and filter)
      // Batch to avoid URL length limits
      const BATCH_SIZE = 100;
      const allEvents: Array<{
        Event_ID: number;
        Event_Start_Date: string;
      }> = [];

      for (let i = 0; i < uniqueEventIds.length; i += BATCH_SIZE) {
        const batchIds = uniqueEventIds.slice(i, i + BATCH_SIZE);
        const batch = await this.mp!.getTableRecords<{
          Event_ID: number;
          Event_Start_Date: string;
        }>({
          table: 'Events',
          select: 'Event_ID,Event_Start_Date',
          filter: `Event_ID IN (${batchIds.join(',')}) AND Cancelled = 0`
        });
        allEvents.push(...batch);
      }

      console.log(`Found ${allEvents.length} events`);

      // Create a map of Event_ID to Event_Start_Date
      const eventDateMap = new Map(allEvents.map(e => [e.Event_ID, e.Event_Start_Date]));

      // Filter Event_Participants to only include events within date range and on Sundays
      const sundayParticipants = eventParticipants.filter(p => {
        const eventDate = eventDateMap.get(p.Event_ID);
        if (!eventDate) return false;

        const date = new Date(eventDate);

        // Check if within date range
        if (date < startDate || date > endDate) return false;

        // Check if Sunday (getDay() returns 0 for Sunday)
        return date.getDay() === 0;
      });

      console.log(`After filtering to Sundays in date range: ${sundayParticipants.length} participants`);

      if (sundayParticipants.length === 0) return { monthly: [], weekly: [] };

      // Step 4a: Group data by month and group (for monthly aggregation)
      const monthlyGroupData = new Map<string, Map<number, {
        participantIds: Set<number>;
        eventIds: Set<number>;
      }>>();

      // Step 4b: Group data by event date and group (for weekly aggregation)
      const weeklyGroupData = new Map<string, Map<number, {
        participantIds: Set<number>;
      }>>();

      for (const participant of sundayParticipants) {
        const eventDate = eventDateMap.get(participant.Event_ID);
        if (!eventDate) continue;

        const date = new Date(eventDate);
        const monthKey = date.toISOString().slice(0, 7); // "2025-09"
        const dateKey = date.toISOString().slice(0, 10); // "2025-09-07"

        // Monthly aggregation
        if (!monthlyGroupData.has(monthKey)) {
          monthlyGroupData.set(monthKey, new Map());
        }
        const monthData = monthlyGroupData.get(monthKey)!;
        if (!monthData.has(participant.Group_ID)) {
          monthData.set(participant.Group_ID, {
            participantIds: new Set(),
            eventIds: new Set()
          });
        }
        const monthGroupData = monthData.get(participant.Group_ID)!;
        monthGroupData.participantIds.add(participant.Event_Participant_ID);
        monthGroupData.eventIds.add(participant.Event_ID);

        // Weekly aggregation
        if (!weeklyGroupData.has(dateKey)) {
          weeklyGroupData.set(dateKey, new Map());
        }
        const weekData = weeklyGroupData.get(dateKey)!;
        if (!weekData.has(participant.Group_ID)) {
          weekData.set(participant.Group_ID, { participantIds: new Set() });
        }
        weekData.get(participant.Group_ID)!.participantIds.add(participant.Event_Participant_ID);
      }

      // Build monthly trends (averages)
      const monthly: CommunityAttendanceTrend[] = [];
      for (const [monthKey, groupsData] of Array.from(monthlyGroupData.entries()).sort()) {
        const communityAttendance: { [communityName: string]: number } = {};
        for (const [groupId, data] of groupsData) {
          const communityName = communityNameMap.get(groupId) || 'Unknown';
          const average = data.participantIds.size / data.eventIds.size;
          communityAttendance[communityName] = Math.round(average);
        }
        monthly.push({
          weekStartDate: monthKey + '-01',
          communityAttendance
        });
      }

      // Build weekly trends (per-date counts)
      const weekly: CommunityAttendanceTrend[] = [];
      for (const [dateKey, groupsData] of Array.from(weeklyGroupData.entries()).sort()) {
        const communityAttendance: { [communityName: string]: number } = {};
        for (const [groupId, data] of groupsData) {
          const communityName = communityNameMap.get(groupId) || 'Unknown';
          communityAttendance[communityName] = data.participantIds.size;
        }
        weekly.push({
          weekStartDate: dateKey,
          communityAttendance
        });
      }

      console.log(`Returning ${monthly.length} monthly and ${weekly.length} weekly trends`);
      return { monthly, weekly };
    } catch (error) {
      console.error('Error fetching community attendance trends:', error);
      return { monthly: [], weekly: [] };
    }
  }

  /**
   * Gets monthly worship service attendance trends (September - August)
   *
   * @param startDate - Start date of period (September 1)
   * @param endDate - End date of period (August 31)
   * @returns Promise<MonthlyAttendanceTrend[]> - Monthly attendance data
   */
  private async getMonthlyAttendanceTrends(
    startDate: Date,
    endDate: Date
  ): Promise<MonthlyAttendanceTrend[]> {
    try {
      const trends: MonthlyAttendanceTrend[] = [];
      const currentDate = new Date(startDate);

      // Loop through each month in the ministry year (Sept - Aug)
      while (currentDate <= endDate) {
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        const monthStartIso = monthStart.toISOString();
        const monthEndIso = monthEnd.toISOString();

        // Get worship service events for this month (Event_Type_ID = 7)
        const events = await this.mp!.getTableRecords<{
          Event_ID: number;
        }>({
          table: 'Events',
          select: 'Event_ID',
          filter: `
            Events.Event_Start_Date >= '${monthStartIso}' AND
            Events.Event_End_Date <= '${monthEndIso}' AND
            Events.Cancelled = 0 AND
            Events.Event_Type_ID = 7
          `
        });

        const eventIds = events.map(e => e.Event_ID);
        let totalInPerson = 0;
        let totalOnline = 0;
        let eventCount = 0;

        if (eventIds.length > 0) {
          // Get attendance metrics from Event_Metrics (Metric_ID 2 = In-Person, 3 = Online)
          const eventMetrics = await this.mp!.getTableRecords<{
            Event_ID: number;
            Metric_ID: number;
            Numerical_Value: number;
          }>({
            table: 'Event_Metrics',
            select: 'Event_ID,Metric_ID,Numerical_Value',
            filter: `
              Event_Metrics.Event_ID IN (${eventIds.join(',')}) AND
              Event_Metrics.Metric_ID IN (2, 3)
            `
          });

          // Track which events have metrics
          const eventsWithMetrics = new Set<number>();

          for (const metric of eventMetrics) {
            eventsWithMetrics.add(metric.Event_ID);

            if (metric.Metric_ID === 2) {
              // In-Person attendance
              totalInPerson += metric.Numerical_Value;
            } else if (metric.Metric_ID === 3) {
              // Online attendance
              totalOnline += metric.Numerical_Value;
            }
          }

          eventCount = eventsWithMetrics.size;
        }

        trends.push({
          month: `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`,
          monthName: MONTH_NAMES[currentDate.getMonth()],
          averageInPersonAttendance: eventCount > 0 ? Math.round(totalInPerson / eventCount) : 0,
          averageOnlineAttendance: eventCount > 0 ? Math.round(totalOnline / eventCount) : 0,
          averageTotalAttendance: eventCount > 0 ? Math.round((totalInPerson + totalOnline) / eventCount) : 0,
          eventCount
        });

        // Move to next month
        currentDate.setMonth(currentDate.getMonth() + 1);
      }

      return trends;
    } catch (error) {
      console.error('Error fetching monthly attendance trends:', error);
      return [];
    }
  }

  /**
   * Gets per-event-date worship service attendance data
   * Used to show individual weekly data points when a single month is selected
   *
   * @param startDate - Start date of period
   * @param endDate - End date of period
   * @returns Promise<WeeklyAttendanceTrend[]> - Per-date attendance data sorted chronologically
   */
  private async getWeeklyAttendanceTrends(
    startDate: Date,
    endDate: Date
  ): Promise<WeeklyAttendanceTrend[]> {
    const startIso = startDate.toISOString();
    const endIso = endDate.toISOString();

    try {
      // Fetch all worship service events with their dates
      const events = await this.mp!.getTableRecords<{
        Event_ID: number;
        Event_Start_Date: string;
      }>({
        table: 'Events',
        select: 'Event_ID,Event_Start_Date',
        filter: `
          Events.Event_Start_Date >= '${startIso}' AND
          Events.Event_End_Date <= '${endIso}' AND
          Events.Cancelled = 0 AND
          Events.Event_Type_ID = 7
        `
      });

      if (events.length === 0) return [];

      const eventIds = events.map(e => e.Event_ID);

      // Fetch all metrics for these events
      const eventMetrics = await this.mp!.getTableRecords<{
        Event_ID: number;
        Metric_ID: number;
        Numerical_Value: number;
      }>({
        table: 'Event_Metrics',
        select: 'Event_ID,Metric_ID,Numerical_Value',
        filter: `
          Event_Metrics.Event_ID IN (${eventIds.join(',')}) AND
          Event_Metrics.Metric_ID IN (2, 3)
        `
      });

      // Build event-to-date map
      const eventDateMap = new Map(events.map(e => [e.Event_ID, e.Event_Start_Date]));

      // Group metrics by date (YYYY-MM-DD)
      const dateGroups = new Map<string, {
        inPerson: number;
        online: number;
        eventIds: Set<number>;
      }>();

      for (const metric of eventMetrics) {
        const eventDate = eventDateMap.get(metric.Event_ID);
        if (!eventDate) continue;

        const dateKey = new Date(eventDate).toISOString().slice(0, 10);

        if (!dateGroups.has(dateKey)) {
          dateGroups.set(dateKey, { inPerson: 0, online: 0, eventIds: new Set() });
        }

        const group = dateGroups.get(dateKey)!;
        group.eventIds.add(metric.Event_ID);

        if (metric.Metric_ID === 2) {
          group.inPerson += metric.Numerical_Value;
        } else if (metric.Metric_ID === 3) {
          group.online += metric.Numerical_Value;
        }
      }

      // Convert to sorted array
      const trends: WeeklyAttendanceTrend[] = Array.from(dateGroups.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([dateKey, data]) => {
          const [year, month, day] = dateKey.split('-').map(Number);
          const date = new Date(year, month - 1, day);
          const dateLabel = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          });

          return {
            eventDate: dateKey,
            dateLabel,
            inPersonAttendance: data.inPerson,
            onlineAttendance: data.online,
            totalAttendance: data.inPerson + data.online,
            eventCount: data.eventIds.size
          };
        });

      return trends;
    } catch (error) {
      console.error('Error fetching weekly attendance trends:', error);
      return [];
    }
  }

  /**
   * Gets the count of baptisms for a specific date range
   * Queries Participant_Milestones for records where:
   * - Milestone_ID = 3 (Baptism)
   * - Date_Accomplished is within the specified date range
   *
   * @param startDate - Start date of the period (365 days ago from reference date)
   * @param endDate - End date of the period (reference date, typically today)
   * @returns Promise<number> - Count of baptisms in the specified period
   */
  private async getBaptismsCount(startDate: Date, endDate: Date): Promise<number> {
    try {
      const startIso = startDate.toISOString();
      const endIso = endDate.toISOString();

      // Query Participant_Milestones for baptisms (Milestone_ID = 3) in the date range
      const participantMilestones = await this.mp!.getTableRecords<{
        Participant_Milestone_ID: number;
      }>({
        table: 'Participant_Milestones',
        select: 'Participant_Milestone_ID',
        filter: `
          Participant_Milestones.Milestone_ID = 3 AND
          Participant_Milestones.Date_Accomplished >= '${startIso}' AND
          Participant_Milestones.Date_Accomplished <= '${endIso}'
        `
      });

      console.log(`Found ${participantMilestones.length} baptisms between ${startDate.toISOString().split('T')[0]} and ${endDate.toISOString().split('T')[0]}`);
      return participantMilestones.length;
    } catch (error) {
      console.error('Error fetching baptisms count:', error);
      return 0;
    }
  }

  /**
   * Calculate year-over-year comparison metrics
   *
   * @param current - Current period metrics
   * @param previous - Previous period metrics
   * @param currentGroups - Current group type metrics
   * @param currentEvents - Current event type metrics
   * @returns YearOverYearMetrics[] - Year-over-year comparisons
   */
  private calculateYearOverYear(
    current: PeriodMetrics,
    previous: PeriodMetrics,
    currentGroups: GroupTypeMetrics[],
    currentEvents: EventTypeMetrics[]
  ): YearOverYearMetrics[] {
    const metrics: YearOverYearMetrics[] = [];

    // Overall attendance YoY
    metrics.push({
      metric: 'Average Attendance',
      currentYear: current.averageAttendance,
      previousYear: previous.averageAttendance,
      percentageChange: this.calculatePercentChange(current.averageAttendance, previous.averageAttendance),
      trend: this.determineTrend(current.averageAttendance, previous.averageAttendance)
    });

    metrics.push({
      metric: 'Unique Attendees',
      currentYear: current.uniqueAttendees,
      previousYear: previous.uniqueAttendees,
      percentageChange: this.calculatePercentChange(current.uniqueAttendees, previous.uniqueAttendees),
      trend: this.determineTrend(current.uniqueAttendees, previous.uniqueAttendees)
    });

    // Total events YoY
    metrics.push({
      metric: 'Total Events',
      currentYear: current.totalEvents,
      previousYear: previous.totalEvents,
      percentageChange: this.calculatePercentChange(current.totalEvents, previous.totalEvents),
      trend: this.determineTrend(current.totalEvents, previous.totalEvents)
    });

    // Active groups YoY
    const currentGroupCount = currentGroups.reduce((sum, g) => sum + g.activeGroupCount, 0);
    const currentParticipants = currentGroups.reduce((sum, g) => sum + g.uniqueParticipants, 0);
    const currentEventTypes = currentEvents.length;

    metrics.push({
      metric: 'Active Groups',
      currentYear: currentGroupCount,
      previousYear: 0, // Would need to query previous year groups
      percentageChange: 0,
      trend: 'stable'
    });

    metrics.push({
      metric: 'Group Participants',
      currentYear: currentParticipants,
      previousYear: 0, // Would need to query previous year groups
      percentageChange: 0,
      trend: 'stable'
    });

    metrics.push({
      metric: 'Event Types Active',
      currentYear: currentEventTypes,
      previousYear: 0, // Would need to query previous year events
      percentageChange: 0,
      trend: 'stable'
    });

    return metrics;
  }

  /**
   * Calculate percentage change between two values
   *
   * @param current - Current value
   * @param previous - Previous value
   * @returns number - Percentage change
   */
  private calculatePercentChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  /**
   * Determine trend direction
   *
   * @param current - Current value
   * @param previous - Previous value
   * @returns 'up' | 'down' | 'stable' - Trend direction
   */
  private determineTrend(current: number, previous: number): 'up' | 'down' | 'stable' {
    const change = this.calculatePercentChange(current, previous);
    if (Math.abs(change) < 5) return 'stable';
    return change > 0 ? 'up' : 'down';
  }
}
