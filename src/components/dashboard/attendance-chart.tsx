'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { MonthlyAttendanceTrend } from '@/lib/dto';

interface AttendanceChartProps {
  currentYear: MonthlyAttendanceTrend[];
  previousYear: MonthlyAttendanceTrend[];
  height?: number;
}

export function AttendanceChart({ currentYear, previousYear, height = 300 }: AttendanceChartProps) {
  // Filter out months with 0 average and combine data by month name
  const currentFiltered = currentYear.filter(item => item.averageTotalAttendance > 0);
  const previousFiltered = previousYear.filter(item => item.averageTotalAttendance > 0);

  // Detect if this is weekly data (month field is a date YYYY-MM-DD instead of YYYY-MM)
  const isWeekly = currentFiltered.length > 0 && currentFiltered[0].month.length > 7;

  // Create a map of all unique data points
  const monthsMap = new Map<string, {
    name: string;
    sortKey: string;
    currentInPerson?: number;
    currentOnline?: number;
    currentTotal?: number;
    previousInPerson?: number;
    previousOnline?: number;
    previousTotal?: number;
  }>();

  // Add current year data
  currentFiltered.forEach(item => {
    monthsMap.set(item.monthName, {
      name: item.monthName,
      sortKey: item.month, // YYYY-MM for monthly, YYYY-MM-DD for weekly
      currentInPerson: item.averageInPersonAttendance,
      currentOnline: item.averageOnlineAttendance,
      currentTotal: item.averageTotalAttendance
    });
  });

  // Add previous year data
  if (!isWeekly) {
    // For monthly data, merge by month name (e.g., "February" matches across years)
    previousFiltered.forEach(item => {
      const existing = monthsMap.get(item.monthName);
      if (existing) {
        existing.previousInPerson = item.averageInPersonAttendance;
        existing.previousOnline = item.averageOnlineAttendance;
        existing.previousTotal = item.averageTotalAttendance;
      } else {
        monthsMap.set(item.monthName, {
          name: item.monthName,
          sortKey: item.month,
          previousInPerson: item.averageInPersonAttendance,
          previousOnline: item.averageOnlineAttendance,
          previousTotal: item.averageTotalAttendance
        });
      }
    });
  }

  // Sort: by ministry year order for monthly data, chronologically for weekly
  const monthOrder = ['September', 'October', 'November', 'December', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August'];
  const chartData = Array.from(monthsMap.values()).sort((a, b) => {
    if (isWeekly) {
      return a.sortKey.localeCompare(b.sortKey);
    }
    return monthOrder.indexOf(a.name) - monthOrder.indexOf(b.name);
  });

  if (chartData.length === 0) {
    return (
      <div className={`h-[${height}px] flex items-center justify-center text-muted-foreground`}>
        No attendance data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="name"
          className="text-xs"
          padding={{ left: 20, right: 20 }}
        />
        <YAxis className="text-xs" />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
          }}
        />
        <Legend />
        <Line dataKey="currentInPerson" stroke="#3b82f6" strokeWidth={2} name={isWeekly ? 'In-Person' : 'In-Person (Current)'} />
        {!isWeekly && <Line dataKey="previousInPerson" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" name="In-Person (Previous)" />}
        <Line dataKey="currentOnline" stroke="#10b981" strokeWidth={2} name={isWeekly ? 'Online' : 'Online (Current)'} />
        {!isWeekly && <Line dataKey="previousOnline" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" name="Online (Previous)" />}
        <Line dataKey="currentTotal" stroke="#f59e0b" strokeWidth={2} name={isWeekly ? 'Total' : 'Total (Current)'} />
        {!isWeekly && <Line dataKey="previousTotal" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" name="Total (Previous)" />}
      </LineChart>
    </ResponsiveContainer>
  );
}
