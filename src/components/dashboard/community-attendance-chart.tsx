'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CommunityAttendanceTrend } from '@/lib/dto';

interface CommunityAttendanceChartProps {
  data: CommunityAttendanceTrend[];
  height?: number;
}

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

// Recharts tooltip types
interface TooltipPayloadEntry {
  value: number | undefined;
  name: string;
  fill?: string;
  color?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

// Custom tooltip component that sorts communities by value (largest first)
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload || payload.length === 0) return null;

  // Sort payload by value (descending: largest to smallest)
  const sortedPayload = [...payload].sort((a, b) => (b.value || 0) - (a.value || 0));

  return (
    <div
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        border: '1px solid rgba(0, 0, 0, 0.1)',
        borderRadius: '6px',
        padding: '10px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
      }}
    >
      <p style={{ marginBottom: '8px', fontWeight: 'bold' }}>{label}</p>
      {sortedPayload.map((entry, index: number) => (
        <div key={`item-${index}`} style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              backgroundColor: entry.fill || entry.color,
              marginRight: '8px',
              borderRadius: '2px'
            }}
          />
          <span style={{ fontSize: '14px' }}>
            {entry.name}: <strong>{entry.value}</strong>
          </span>
        </div>
      ))}
    </div>
  );
};

export function CommunityAttendanceChart({ data, height = 400 }: CommunityAttendanceChartProps) {
  if (data.length === 0) {
    return (
      <div className={`h-[${height}px] flex items-center justify-center text-muted-foreground`}>
        No community attendance data available
      </div>
    );
  }

  // Extract all unique community names and calculate average attendance
  const communityTotals = new Map<string, { sum: number; count: number }>();
  data.forEach(week => {
    Object.entries(week.communityAttendance).forEach(([name, attendance]) => {
      const current = communityTotals.get(name) || { sum: 0, count: 0 };
      communityTotals.set(name, {
        sum: current.sum + attendance,
        count: current.count + 1
      });
    });
  });

  // Sort communities by average attendance (ascending: smallest to largest)
  const sortedCommunityNames = Array.from(communityTotals.entries())
    .map(([name, totals]) => ({ name, average: totals.sum / totals.count }))
    .sort((a, b) => a.average - b.average)
    .map(item => item.name);

  // Format data for recharts
  const chartData = data.map(week => {
    // Parse date in local time to avoid timezone shifting
    const [year, month, day] = week.weekStartDate.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed in Date constructor
    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    });

    return {
      date: formattedDate,
      ...week.communityAttendance
    };
  });

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          angle={0}
          textAnchor="middle"
          height={60}
          className="text-xs"
        />
        <YAxis className="text-xs" label={{ value: 'Attendance', angle: -90, position: 'insideLeft' }} />
        <Tooltip
          content={<CustomTooltip />}
          wrapperStyle={{ zIndex: 1000 }}
        />
        <Legend />
        {sortedCommunityNames.map((communityName, index) => (
          <Area
            key={communityName}
            type="monotone"
            dataKey={communityName}
            stackId="attendance"
            stroke={CHART_COLORS[index % CHART_COLORS.length]}
            fill={CHART_COLORS[index % CHART_COLORS.length]}
            name={communityName}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
