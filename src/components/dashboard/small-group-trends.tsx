'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { SmallGroupTrend } from '@/lib/dto';

interface SmallGroupTrendsProps {
  data: SmallGroupTrend[];
  height?: number;
}

export function SmallGroupTrends({ data, height = 300 }: SmallGroupTrendsProps) {
  const chartData = data.map(item => ({
    month: new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    groups: item.activeGroupCount,
    participants: item.totalParticipants
  }));

  if (chartData.length === 0) {
    return (
      <div className={`h-[${height}px] flex items-center justify-center text-muted-foreground`}>
        No small group trend data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="month" className="text-xs" />
        <YAxis yAxisId="left" className="text-xs" />
        <YAxis yAxisId="right" orientation="right" className="text-xs" />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px'
          }}
        />
        <Legend />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="groups"
          stroke="#3b82f6"
          name="Active Groups"
          strokeWidth={2}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="participants"
          stroke="#10b981"
          name="Total Participants"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
