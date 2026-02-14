'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { SmallGroupTrend } from '@/lib/dto';

interface SmallGroupTrendsProps {
  data: SmallGroupTrend[];
  previousYear?: SmallGroupTrend[];
  height?: number;
}

// Ministry year month ordering for chart X-axis
const MONTH_ORDER = [
  'September', 'October', 'November', 'December',
  'January', 'February', 'March', 'April', 'May',
  'June', 'July', 'August'
];

export function SmallGroupTrends({ data, previousYear = [], height = 300 }: SmallGroupTrendsProps) {
  // Build a map keyed by month name, merging current and previous year data
  const monthsMap = new Map<string, {
    name: string;
    groups?: number;
    participants?: number;
    previousGroups?: number;
    previousParticipants?: number;
  }>();

  // Add current year data (uses monthName from the data layer — no YYYY-MM parsing needed)
  data.forEach(item => {
    monthsMap.set(item.monthName, {
      name: item.monthName,
      groups: item.activeGroupCount,
      participants: item.totalParticipants
    });
  });

  // Add previous year data
  previousYear.forEach(item => {
    const existing = monthsMap.get(item.monthName);
    if (existing) {
      existing.previousGroups = item.activeGroupCount;
      existing.previousParticipants = item.totalParticipants;
    } else {
      monthsMap.set(item.monthName, {
        name: item.monthName,
        previousGroups: item.activeGroupCount,
        previousParticipants: item.totalParticipants
      });
    }
  });

  // Sort by ministry year order
  const chartData = Array.from(monthsMap.values()).sort((a, b) => {
    return MONTH_ORDER.indexOf(a.name) - MONTH_ORDER.indexOf(b.name);
  });

  const hasPrevious = previousYear.length > 0;

  if (chartData.length === 0) {
    return (
      <div className={`h-[${height}px] flex items-center justify-center text-muted-foreground`}>
        No small group trend data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="name" className="text-xs" padding={{ left: 20, right: 20 }} />
        <YAxis yAxisId="left" className="text-xs" />
        <YAxis yAxisId="right" orientation="right" className="text-xs" />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
          }}
        />
        <Legend />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="groups"
          stroke="#3b82f6"
          name={hasPrevious ? 'Active Groups (Current)' : 'Active Groups'}
          strokeWidth={2}
        />
        {hasPrevious && (
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="previousGroups"
            stroke="#3b82f6"
            strokeDasharray="5 5"
            name="Active Groups (Previous)"
            strokeWidth={2}
          />
        )}
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="participants"
          stroke="#10b981"
          name={hasPrevious ? 'Total Participants (Current)' : 'Total Participants'}
          strokeWidth={2}
        />
        {hasPrevious && (
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="previousParticipants"
            stroke="#10b981"
            strokeDasharray="5 5"
            name="Total Participants (Previous)"
            strokeWidth={2}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
