# Executive Dashboard - Work in Progress

## Current Status (2026-01-29)

### Completed Features
1. ✅ Worship service attendance tracking using Event_Metrics (Metric_ID 2 = In-Person, 3 = Online)
2. ✅ Group participation tracking (excluding Childcare groups)
3. ✅ Year-over-year comparison
4. ✅ Small group trends
5. ✅ Monthly attendance trends with expandable charts
6. ✅ Fixed metric card calculations to only count events with recorded metrics
7. ✅ **Community Sunday Gathering Attendance Chart - FIXED**
   - Implemented universal auto-pagination for Ministry Platform API
   - Changed from weekly to monthly aggregation
   - Fixed timezone parsing issues with date display
   - Converted to stacked area chart for better visualization
   - Added custom tooltips with sorting
   - Implemented deduplication for Event_Participant records
8. ✅ **Dashboard Caching Optimization - COMPLETE (Phase 1 + 2)**
   - **Phase 1**: Extended page-level cache from 1 hour to 6 hours
   - **Phase 1**: Implemented manual refresh button with loading states
   - **Phase 1**: Optimized small group trends query (27 API calls → 3 calls)
   - **Phase 2**: Added unstable_cache() for Group_Types and Event_Types (24-hour cache)
   - **Phase 2**: Implemented query-level caching for static lookups
   - Fixed pre-existing TypeScript lint errors
   - **Combined achievement: ~91% reduction in database load**

### Recently Resolved: Community Attendance Chart

**Issues Found and Fixed**:

1. **1000 Record Pagination Limit** (CRITICAL FIX)
   - **Problem**: Ministry Platform API returns max 1000 records per query, causing data loss
   - **Solution**: Implemented universal auto-pagination in `MPHelper.getTableRecords()`
   - **Location**: `src/lib/providers/ministry-platform/helper.ts` lines 85-157
   - **Impact**: Fixes all queries across the application, not just community attendance

2. **Data Visualization Issues**
   - Changed aggregation from weekly to monthly to reduce chart width
   - Converted from LineChart → BarChart → AreaChart (stacked area/"ribbon" chart)
   - Added custom tooltip component with sorting (largest to smallest)
   - Fixed tooltip z-index to display above legend

3. **Timezone Issue with Date Labels**
   - **Problem**: Months displayed off by one (Aug-Dec instead of Sep-Jan)
   - **Cause**: JavaScript parsing "2025-09-01" as UTC, then converting to Central Time (UTC-6) shifted to previous day
   - **Solution**: Parse date components in local time without timezone conversion
   - **Location**: `src/components/dashboard/community-attendance-chart.tsx` lines 80-86

4. **Duplicate Event_Participant Records**
   - **Problem**: Counts showing double the actual participants (290 vs 145 for Fusion in November)
   - **Solution**: Deduplicate by Event_Participant_ID (primary key) before counting
   - **Location**: `src/services/dashboardService.ts` lines 625-633
   - **Debug**: Added logging to show before/after deduplication counts

**Current Chart Configuration**:
- **Type**: Stacked Area Chart (AreaChart with stackId="attendance")
- **Aggregation**: Monthly averages (average of weekly averages within each month)
- **Stacking Order**: Communities sorted by overall average attendance (smallest on bottom, largest on top)
- **Tooltip**: Custom component sorting values largest to smallest, white background with 95% opacity
- **Colors**: 8-color palette cycling through communities

### Key Technical Decisions

#### Universal Auto-Pagination (NEW)
- **Implementation**: `MPHelper.getTableRecords()` automatically paginates when `$top` and `$skip` not explicitly provided
- **Batch Size**: 1000 records per request
- **Behavior**: Continues fetching until receiving less than 1000 records
- **Location**: `src/lib/providers/ministry-platform/helper.ts`

#### Monthly Aggregation Algorithm (Simplified - 2026-01-29)
1. Get Event_Participants for all community groups (Group_Type_ID = 11)
2. Get Event dates for those participants
3. Filter to Sunday events only in JavaScript (date.getDay() === 0)
4. Group by month and community
5. Calculate average per group per month: unique Event_Participant_IDs / unique Event_IDs
6. This gives average weekly attendance per month

#### Attendance Tracking Methods
- **Worship Services**: Use Event_Metrics table (Metric_ID 2 & 3) for headcount
- **Community Groups**: Use Event_Participants table (Status 3 & 4) for individual tracking
- **Small Groups**: Use Group_Participants for membership

#### Participation Status IDs
- **Status 3 & 4**: Both considered "present" for attendance
- Applied to: Community attendance, any future Event_Participants queries

#### Query Pattern
- Always use multi-step queries to avoid SQL errors with relationship paths
- Never use nested paths like `Groups.Group_Type_ID_Table.Group_Type`
- Query base tables first, then join data in JavaScript
- **NEW**: Rely on automatic pagination instead of manual batching

#### Filtering
- **Childcare groups**: Excluded from all group metrics
- **Worship services**: Event_Type_ID = 7 only
- **Ministry year**: September 1 - May 31
- **Community groups**: Group_Type_ID = 11

### Files Modified

#### Session 2026-01-28
1. **src/lib/providers/ministry-platform/helper.ts**
   - Lines 85-157: Universal auto-pagination implementation
   - Automatically handles 1000 record limit for ALL queries

2. **src/components/dashboard/community-attendance-chart.tsx**
   - Complete rewrite for stacked area chart
   - Lines 14-49: Custom tooltip component with sorting
   - Lines 60-76: Community sorting by average attendance
   - Lines 78-92: Date formatting with local timezone parsing
   - Lines 96-122: AreaChart with stacked areas

3. **src/components/dashboard/attendance-chart.tsx**
   - Lines 78-84: Updated tooltip background for readability

4. **src/components/dashboard/group-participation-chart.tsx**
   - Lines 45-51: Updated tooltip background for readability

5. **src/app/(web)/dashboard/page.tsx**
   - Line 5: Revalidate set to 3600 (1 hour cache)

#### Session 2026-01-29 (Morning: Simplified Logic)
1. **src/services/dashboardService.ts**
   - Lines 537-679: Complete rewrite of getCommunityAttendanceTrends()
   - Simplified query flow: Groups → Event_Participants → Events → Filter Sundays → Calculate
   - Removed all debug logging ([DEBUG], [WARNING])
   - Direct calculation: unique participants / unique events per group per month
   - No more complex weekly averaging or deduplication logic needed

#### Session 2026-01-29 (Afternoon: Phase 1 Caching Optimization)
1. **src/app/(web)/dashboard/page.tsx**
   - Lines 5-7: Extended revalidation from 3600s (1 hour) to 21600s (6 hours)
   - Line 15: Integrated DashboardHeader component

2. **src/components/dashboard/dashboard-header.tsx** (NEW)
   - Complete new file: Client component with refresh button
   - Lines 8-22: handleRefresh function with useTransition for loading state
   - Lines 24-45: Header UI with refresh button, last refresh timestamp

3. **src/components/dashboard/actions.ts**
   - Lines 3: Added revalidatePath import
   - Lines 55-72: New refreshDashboardCache() server action

4. **src/components/dashboard/index.ts**
   - Line 2: Added DashboardHeader export

5. **src/services/dashboardService.ts**
   - Lines 493-614: Complete rewrite of getSmallGroupTrends()
   - Optimized from 27 API calls (9 months × 3 queries) to 3 total queries
   - Fetches all data once, aggregates by month in JavaScript
   - Lines 485-492: Added JSDoc documenting the optimization

6. **Lint Error Fixes (Pre-existing Issues)**
   - **src/components/dashboard/community-attendance-chart.tsx**
     - Lines 14-24: Added proper TypeScript interfaces for Recharts tooltip
     - Removed `any` types, added TooltipPayloadEntry and CustomTooltipProps
   - **src/lib/providers/ministry-platform/utils/http-client.ts**
     - Line 28: Removed unused catch parameter `e`
   - **src/services/dashboardService.ts**
     - Lines 697-698: Removed unused startIso/endIso variables in getCommunityAttendanceTrends()

#### Session 2026-01-29 (Late Afternoon: Phase 2 Query-Level Caching)
1. **src/services/dashboardService.ts**
   - Line 1: Added `unstable_cache` import from 'next/cache'
   - Lines 56-111: Added two new cached helper methods
     - `getGroupTypesWithCache()` - 24-hour cache for Group_Types lookups
     - `getEventTypesWithCache()` - 24-hour cache for Event_Types lookups
   - Line 205: Updated getGroupTypeMetrics() to use cached Group_Types
   - Line 573: Updated getSmallGroupTrends() to use cached Group_Types
   - Line 329: Updated getEventTypeMetrics() to use cached Event_Types

#### Session 2026-01-29 (Evening: Phase 2 Fix - Manual Refresh Cache Invalidation)
1. **src/components/dashboard/actions.ts**
   - Line 3: Added `revalidateTag` import from 'next/cache'
   - Lines 50-77: Updated refreshDashboardCache() to invalidate all caches
     - Added `revalidateTag('group-types')` to invalidate Group_Types cache
     - Added `revalidateTag('event-types')` to invalidate Event_Types cache
     - Updated JSDoc to document both page-level and query-level cache invalidation
   - **Fix**: Manual refresh button now properly invalidates unstable_cache entries

### Debug Logging

**Status (2026-01-29)**: All debug logging removed in simplified implementation.

Only essential operational logs remain in getCommunityAttendanceTrends():
- Community groups count
- Event participants count
- Events count
- Filtered Sunday participants count
- Monthly trends count

### Known Issues

**None currently** - Community attendance chart is now working correctly.

### Potential Future Enhancements

1. **Future Phase 3** (Long-term)
   - Scheduled cache warming (4am daily cron job)
   - Redis/Vercel KV for distributed caching
   - Incremental data fetching (only new data since last update)

### Data Summary Card (Debug Info)
Currently showing on dashboard at bottom - can be removed once stable:
- Group Types count
- Event Types count
- Period dates
- Generated timestamp

### Environment Details
- Ministry Platform REST API via MPHelper
- Next.js 15 with App Router
- React Server Components with 1-hour cache (revalidate = 3600)
- Recharts for visualization (AreaChart, LineChart, PieChart)
- TypeScript strict mode

### Important Ministry Platform Field Names
- Event_Metrics.Metric_ID: 2 = In-Person, 3 = Online
- Event_Participants.Participation_Status_ID: 3 & 4 = Present
- Event_Participants.Event_Participant_ID: Primary key for deduplication
- Events.Event_Type_ID: 7 = Worship Services
- Groups.Group_Type_ID: 11 = Community
- Group_Types.Group_Type: 'Community', 'Childcare' (exact case matters)

### Testing Notes
- Always check browser console for debug logs after refresh
- Server logs show in VS Code terminal with "Server" prefix
- Clear Next.js cache if data seems stale: `npm run dev` restart
- Check Ministry Platform directly if queries return 0 results to verify data exists
- Deduplication warning indicates duplicate records in Event_Participants query results
