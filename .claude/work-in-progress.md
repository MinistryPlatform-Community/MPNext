# Executive Dashboard - Work in Progress

## Current Status (2026-01-27)

### Completed Features
1. ✅ Worship service attendance tracking using Event_Metrics (Metric_ID 2 = In-Person, 3 = Online)
2. ✅ Group participation tracking (excluding Childcare groups)
3. ✅ Year-over-year comparison
4. ✅ Small group trends
5. ✅ Monthly attendance trends with expandable charts
6. ✅ Fixed metric card calculations to only count events with recorded metrics

### Active Issue: Community Sunday Gathering Attendance Chart
**Status**: Not displaying data - needs investigation

**What was changed**:
- Switched from Event_Metrics to Event_Participants for community attendance
- Fixed query to use multi-step approach instead of relationship path
- Added participation status filter: `Participation_Status_ID IN (3, 4)` for "present"
- Added debug logging at key steps

**Debug logging added** (lines 532-614 in dashboardService.ts):
```typescript
console.log('No Community group type found');
console.log('No Community groups found');
console.log(`Found ${communityGroups.length} Community groups:`, communityGroupIds);
console.log(`Found ${events.length} Sunday events for Community groups`);
console.log(`Found ${eventParticipants.length} event participants with status 3 or 4`);
```

**Next steps**:
1. Check browser console for debug messages to identify where data pipeline fails
2. Possible issues to investigate:
   - Group_Type name might not be exactly 'Community' (check for spaces, case sensitivity)
   - No events scheduled on Sundays (DATEPART(weekday, Events.Event_Start_Date) = 1)
   - No event participants with status 3 or 4 recorded
   - Date range issue (events outside ministry year range)

**Query structure** (getCommunityAttendanceTrends method):
1. Get Community group type ID from Group_Types
2. Get all groups with that type ID
3. Get Sunday events for those groups within date range
4. Get event participants with status 3 or 4
5. Aggregate by week and community

### Key Technical Decisions

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

#### Filtering
- **Childcare groups**: Excluded from all group metrics
- **Worship services**: Event_Type_ID = 7 only
- **Ministry year**: September 1 - May 31

### Files Modified (Most Recent Session)

1. **src/services/dashboardService.ts**
   - Line 149-164: Filter childcare groups properly
   - Line 416-450: Fix period metrics to only count events with recorded metrics
   - Line 527-660: Refactor community attendance to use Event_Participants + add debug logging

2. **src/components/dashboard/dashboard-metrics.tsx**
   - Added ExpandableChart components
   - Updated Active Groups metric to filter for communities and small groups only

3. **src/components/dashboard/attendance-chart.tsx**
   - Changed to line chart comparing current vs previous year monthly data
   - New interface: MonthlyAttendanceTrend instead of EventTypeMetrics

4. **src/components/dashboard/community-attendance-chart.tsx**
   - Added height prop for expandable chart support

5. **src/lib/dto/dashboard.ts**
   - Added MonthlyAttendanceTrend interface

### Known Issues

1. **Community Sunday Gathering Attendance**: No data displaying
   - Debug logs added but need to be checked
   - Issue introduced when switching to Event_Participants

2. **Potential query optimization**: Multiple API calls could be reduced with better query design

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
- Recharts for visualization
- TypeScript strict mode

### Important Ministry Platform Field Names
- Event_Metrics.Metric_ID: 2 = In-Person, 3 = Online
- Event_Participants.Participation_Status_ID: 3 & 4 = Present
- Events.Event_Type_ID: 7 = Worship Services
- Group_Types.Group_Type: 'Community', 'Childcare' (exact case matters)

### Testing Notes
- Always check browser console for debug logs after refresh
- Clear Next.js cache if data seems stale: `npm run dev` restart
- Check Ministry Platform directly if queries return 0 results to verify data exists
