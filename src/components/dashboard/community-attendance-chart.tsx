'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CommunityAttendanceTrend } from '@/lib/dto';

interface CommunityAttendanceChartProps {
  data: CommunityAttendanceTrend[];
  height?: number;
}

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export function CommunityAttendanceChart({ data, height = 400 }: CommunityAttendanceChartProps) {
  if (data.length === 0) {
    return (
      <div className={`h-[${height}px] flex items-center justify-center text-muted-foreground`}>
        No community attendance data available
      </div>
    );
  }

  // Extract all unique community names
  const communityNames = new Set<string>();
  data.forEach(week => {
    Object.keys(week.communityAttendance).forEach(name => communityNames.add(name));
  });

  // Format data for recharts
  const chartData = data.map(week => {
    const formattedDate = new Date(week.weekStartDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });

    return {
      date: formattedDate,
      ...week.communityAttendance
    };
  });

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          angle={-45}
          textAnchor="end"
          height={80}
          className="text-xs"
        />
        <YAxis className="text-xs" label={{ value: 'Attendance', angle: -90, position: 'insideLeft' }} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px'
          }}
        />
        <Legend />
        {Array.from(communityNames).map((communityName, index) => (
          <Line
            key={communityName}
            type="monotone"
            dataKey={communityName}
            stroke={CHART_COLORS[index % CHART_COLORS.length]}
            strokeWidth={2}
            dot={{ r: 3 }}
            name={communityName}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
