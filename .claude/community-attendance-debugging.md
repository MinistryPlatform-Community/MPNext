# Community Attendance Chart - Debugging Guide

## Issue
The Community Sunday Gathering Attendance chart shows "No community attendance data available"

## Debug Steps

### 1. Check Browser Console
After refreshing the dashboard, look for these console.log messages:

```
No Community group type found
No Community groups found
Found X Community groups: [array of IDs]
Found X Sunday events for Community groups
Found X event participants with status 3 or 4
```

### 2. Identify Where Pipeline Fails

**If you see "No Community group type found":**
- Query: `SELECT Group_Type_ID, Group_Type FROM Group_Types WHERE Group_Type = 'Community'`
- Problem: Group type name doesn't match exactly
- Check Ministry Platform for actual group type name (case sensitive, check for extra spaces)

**If you see "No Community groups found":**
- Query uses the Group_Type_ID from step 1
- Problem: No groups have that type assigned
- Check Ministry Platform Groups table for groups with Group_Type_ID matching Community

**If you see "Found X Community groups" but "Found 0 Sunday events":**
- Query: Events with Group_ID IN (community group IDs) AND DATEPART(weekday, Event_Start_Date) = 1
- Problem: Either no events scheduled, or events not on Sunday (weekday = 1), or date range issue
- Check date range matches ministry year (Sept 1 - May 31)
- Verify events exist in Ministry Platform with those Group_IDs
- Check if Event_Start_Date is actually Sunday (SQL: Sunday = 1)

**If you see events but "Found 0 event participants":**
- Query: Event_Participants WHERE Event_ID IN (...) AND Participation_Status_ID IN (3, 4)
- Problem: No participants marked as present (status 3 or 4)
- Check Ministry Platform for actual Participation_Status_ID values being used
- May need to adjust status filter

## Manual Testing Queries

Run these directly in Ministry Platform or via API to verify data exists:

### 1. Check Group Type
```sql
SELECT Group_Type_ID, Group_Type
FROM Group_Types
WHERE Group_Type LIKE '%Community%'
```

### 2. Check Community Groups (use Group_Type_ID from above)
```sql
SELECT Group_ID, Group_Name, Group_Type_ID
FROM Groups
WHERE Group_Type_ID = [ID_FROM_STEP_1]
```

### 3. Check Sunday Events (use Group_IDs from above)
```sql
SELECT Event_ID, Group_ID, Event_Start_Date, Event_End_Date
FROM Events
WHERE Group_ID IN (list_from_step_2)
  AND Event_Start_Date >= '2025-09-01'
  AND Event_End_Date <= '2026-05-31'
  AND Cancelled = 0
  AND DATEPART(weekday, Event_Start_Date) = 1
ORDER BY Event_Start_Date
```

### 4. Check Participants (use Event_IDs from above)
```sql
SELECT Event_ID, Participant_ID, Participation_Status_ID
FROM Event_Participants
WHERE Event_ID IN (list_from_step_3)
  AND Participation_Status_ID IN (3, 4)
```

## Code Location
File: `src/services/dashboardService.ts`
Method: `getCommunityAttendanceTrends` (lines 527-660)

## Quick Fixes to Try

### If Group Type name is different:
Change line 544:
```typescript
filter: `Group_Type = 'Community'`
// to whatever the actual name is, e.g.:
filter: `Group_Type = 'Communities'`
```

### If Sunday detection is wrong (maybe Sunday = 7 instead of 1):
Change line 584:
```typescript
DATEPART(weekday, Events.Event_Start_Date) = 1
// to:
DATEPART(weekday, Events.Event_Start_Date) = 7
```

### If different participation statuses are used:
Change line 603:
```typescript
Event_Participants.Participation_Status_ID IN (3, 4)
// to include other statuses, e.g.:
Event_Participants.Participation_Status_ID IN (2, 3, 4)
```

## Current Implementation
```typescript
// Step 1: Get Community group type
const groupTypes = await this.mp!.getTableRecords({
  table: 'Group_Types',
  filter: `Group_Type = 'Community'`
});

// Step 2: Get Community groups
const communityGroups = await this.mp!.getTableRecords({
  table: 'Groups',
  filter: `Group_Type_ID = ${communityTypeId}`
});

// Step 3: Get Sunday events
const events = await this.mp!.getTableRecords({
  table: 'Events',
  filter: `
    Events.Group_ID IN (${communityGroupIds.join(',')}) AND
    Events.Event_Start_Date >= '${startIso}' AND
    Events.Event_End_Date <= '${endIso}' AND
    Events.Cancelled = 0 AND
    DATEPART(weekday, Events.Event_Start_Date) = 1
  `
});

// Step 4: Get participants
const eventParticipants = await this.mp!.getTableRecords({
  table: 'Event_Participants',
  filter: `
    Event_Participants.Event_ID IN (${eventIds.join(',')}) AND
    Event_Participants.Participation_Status_ID IN (3, 4)
  `
});
```
