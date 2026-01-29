# Community Attendance Chart - RESOLVED ✅

## Status: SIMPLIFIED (2026-01-29)

The Community Sunday Gathering Attendance chart logic has been simplified and streamlined for better maintainability and clarity.

## Issues Found and Solutions

### 1. ✅ 1000 Record Pagination Limit (CRITICAL)

**Problem**: Ministry Platform API returns maximum 1000 records per query. When fetching Event_Participants, Group_Participants, or any large dataset, data was being silently truncated.

**Solution**: Implemented universal auto-pagination in `MPHelper.getTableRecords()`:
- Location: `src/lib/providers/ministry-platform/helper.ts` lines 85-157
- Automatically fetches all records in batches of 1000
- Applies to ALL queries across the application
- Only activates when `$top` and `$skip` are not explicitly provided

**Impact**: This was the root cause of missing data across the entire dashboard.

### 2. ✅ Duplicate Event_Participant Records

**Problem**: Attendance counts were exactly double the actual values (e.g., 290 vs 145 for Fusion in November).

**Root Cause**: Event_Participants query was returning duplicate records, possibly due to:
- Multiple batches overlapping
- Database query issues
- Relationship path complications

**Solution**: Deduplicate by Event_Participant_ID (primary key) before counting:
```typescript
const uniqueParticipants = Array.from(
  new Map(eventParticipants.map(p => [p.Event_Participant_ID, p])).values()
);
```
- Location: `src/services/dashboardService.ts` lines 625-633
- Added logging to show duplicate count

### 3. ✅ Monthly Aggregation

**Problem**: Weekly data made chart too wide with 16+ communities over 9 months.

**Solution**: Changed from weekly to monthly aggregation:
- Group events by month (YYYY-MM format)
- Calculate average attendance per community per week
- Then calculate monthly average as: average of weekly averages
- Excludes weeks with no data (doesn't count as 0)

**Algorithm**:
1. Group Event_Participants by month, then week, then community
2. For each week: average attendance = sum of event attendance / number of events
3. For each month: monthly average = sum of weekly averages / number of weeks with data

### 4. ✅ Timezone Issue with Date Labels

**Problem**: Month labels were off by one (showing Aug-Dec instead of Sep-Jan).

**Root Cause**: JavaScript's `new Date("2025-09-01")` parses as UTC midnight, then converts to Central Time (UTC-6), shifting the date to August 31st.

**Solution**: Parse date components in local time:
```typescript
const [year, month, day] = weekStartDate.split('-').map(Number);
const date = new Date(year, month - 1, day); // month is 0-indexed
```
- Location: `src/components/dashboard/community-attendance-chart.tsx` lines 80-86

### 5. ✅ Chart Visualization

**Evolution**: LineChart → BarChart → AreaChart (stacked)

**Final Solution**: Stacked Area Chart ("ribbon chart")
- Each community displays as a colored flowing band
- Stacked order: smallest average on bottom, largest on top
- Custom tooltip showing values largest to smallest
- Tooltip has white background (95% opacity) for readability
- Tooltip displays above legend (z-index: 1000)

**Chart Configuration**:
```typescript
<AreaChart data={chartData}>
  {sortedCommunityNames.map((communityName, index) => (
    <Area
      key={communityName}
      type="monotone"
      dataKey={communityName}
      stackId="attendance"
      stroke={CHART_COLORS[index % CHART_COLORS.length]}
      fill={CHART_COLORS[index % CHART_COLORS.length]}
    />
  ))}
</AreaChart>
```

## Current Implementation (Simplified - 2026-01-29)

### Query Flow

1. **Get Community Groups** (Group_Type_ID = 11):
```typescript
const communityGroups = await this.mp!.getTableRecords({
  table: 'Groups',
  select: 'Group_ID,Group_Name',
  filter: `Group_Type_ID = 11`
});
```

2. **Get Event_Participants directly for community groups**:
```typescript
const eventParticipants = await this.mp!.getTableRecords({
  table: 'Event_Participants',
  select: 'Event_Participant_ID,Event_ID,Group_ID,Participation_Status_ID',
  filter: `Event_Participants.Group_ID IN (${communityGroupIds.join(',')}) AND
           Event_Participants.Participation_Status_ID IN (3, 4)`
});
```

3. **Get Event dates** (batched for URL length):
```typescript
const BATCH_SIZE = 100;
for (let i = 0; i < uniqueEventIds.length; i += BATCH_SIZE) {
  const batch = await this.mp!.getTableRecords({
    table: 'Events',
    select: 'Event_ID,Event_Start_Date',
    filter: `Event_ID IN (${batchIds.join(',')}) AND Cancelled = 0`
  });
  allEvents.push(...batch);
}
```

4. **Filter to Sundays in JavaScript**:
```typescript
const sundayParticipants = eventParticipants.filter(p => {
  const eventDate = eventDateMap.get(p.Event_ID);
  if (!eventDate) return false;
  const date = new Date(eventDate);
  if (date < startDate || date > endDate) return false;
  return date.getDay() === 0; // Sunday
});
```

5. **Calculate average per group per month**:
```typescript
// For each month and group:
// Average = unique Event_Participant_IDs / unique Event_IDs
const average = data.participantIds.size / data.eventIds.size;
```

## Debug Logging

**Status**: All debug logging has been removed in the simplified implementation (2026-01-29).

Only essential console.log statements remain:
- Community groups count
- Event participants count
- Events count
- Filtered Sunday participants count
- Monthly trends count

## Verification Steps

1. **Check console logs** after dashboard refresh:
   - Should see "Found 16 Community groups"
   - Should see "After deduplication: X unique event participants"
   - Should see "[DEBUG] Fusion event:" for each Fusion event
   - Should see monthly averages matching database counts

2. **Verify data accuracy**:
   - Example: Fusion in November 2025
   - Events: 14974, 14975, 14976, 14978 (4 events)
   - Participants: 84 + 78 + 84 + 44 = 290 total
   - Average: 290 / 4 = 72.5 ≈ 73 ✓

3. **Check chart display**:
   - Months should show: Sep 2025, Oct 2025, Nov 2025, Dec 2025, Jan 2026
   - Tooltips should sort largest to smallest
   - Tooltips should appear above legend
   - Stacking order should be consistent (same colors = same communities)

## Files Modified

1. `src/lib/providers/ministry-platform/helper.ts` - Universal auto-pagination
2. `src/services/dashboardService.ts` - Deduplication, monthly aggregation, debug logging
3. `src/components/dashboard/community-attendance-chart.tsx` - Stacked area chart, timezone fix, custom tooltip
4. `src/components/dashboard/attendance-chart.tsx` - Tooltip styling
5. `src/components/dashboard/group-participation-chart.tsx` - Tooltip styling
6. `src/app/(web)/dashboard/page.tsx` - Revalidate cache set to 3600 (1 hour)

## Cleanup Tasks

When stable, these can be cleaned up:

1. **Remove debug logs**:
   - Search for `[DEBUG]` and `[WARNING]` in `dashboardService.ts`
   - Remove Fusion-specific logging
   - Keep essential logs (like deduplication warning)

2. **Consider**:
   - Remove "Data Summary" card from dashboard if no longer needed
   - Archive this debugging file once confirmed stable

## Important Notes

- **Participation Status**: Only status 3 and 4 are counted as "present"
- **Group Type**: Community groups have Group_Type_ID = 11
- **Date Range**: Ministry year is September 1 - May 31
- **Deduplication**: Essential for accurate counts - don't remove
- **Auto-pagination**: Benefits all queries, not just this chart

## Related Issues Prevented

By implementing universal auto-pagination, we also fixed potential issues in:
- Group_Participants queries (can exceed 1000 members)
- Events queries (1688 events in ministry year)
- Any future large dataset queries

## Success Criteria ✅

- [x] Chart displays data instead of "No community attendance data available"
- [x] Attendance counts match database values
- [x] Month labels are correct (Sep-Jan, not Aug-Dec)
- [x] Tooltip is readable with white background
- [x] Tooltip displays above legend
- [x] Communities are stacked consistently by average size
- [x] No duplicate counting of participants
- [x] All records fetched despite 1000 record API limit
