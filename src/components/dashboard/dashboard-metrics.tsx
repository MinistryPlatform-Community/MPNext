'use client';

import { DashboardData } from '@/lib/dto';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard } from './metric-card';
import { AttendanceChart } from './attendance-chart';
import { GroupParticipationChart } from './group-participation-chart';
import { YearOverYearComparison } from './year-over-year-comparison';
import { SmallGroupTrends } from './small-group-trends';
import { CommunityAttendanceChart } from './community-attendance-chart';
import { ExpandableChart } from './expandable-chart';

interface DashboardMetricsProps {
  data: DashboardData;
}

export function DashboardMetrics({ data }: DashboardMetricsProps) {
  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          title="Avg In-Person Attendance (Ministry Year)"
          value={data.currentPeriod.averageInPersonAttendance}
          previousValue={data.previousPeriod.averageInPersonAttendance}
          format="number"
        />
        <MetricCard
          title="Avg Online Attendance (Ministry Year)"
          value={data.currentPeriod.averageOnlineAttendance}
          previousValue={data.previousPeriod.averageOnlineAttendance}
          format="number"
        />
        <MetricCard
          title="Active Communities and Small Groups (Ministry Year)"
          value={data.groupTypeMetrics
            .filter(g =>
              g.groupTypeName.toLowerCase().includes('small') ||
              g.groupTypeName.toLowerCase().includes('community')
            )
            .reduce((sum, g) => sum + g.activeGroupCount, 0)}
          format="number"
        />
        <MetricCard
          title="Baptisms (last 365 days)"
          value={data.baptismsLastYear}
          previousValue={data.baptismsPreviousYear}
          format="number"
        />
      </div>


      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Worship Service Attendance (Ministry Year)</CardTitle>
            <CardDescription>Monthly average attendance comparison (September - May)</CardDescription>
          </CardHeader>
          <CardContent>
            <ExpandableChart
              title="Worship Service Attendance (Ministry Year)"
              description="Monthly average attendance comparison (September - May)"
              expandedChildren={
                <AttendanceChart
                  currentYear={data.monthlyAttendanceTrends}
                  previousYear={data.previousYearMonthlyAttendanceTrends}
                  height={600}
                />
              }
            >
              <AttendanceChart
                currentYear={data.monthlyAttendanceTrends}
                previousYear={data.previousYearMonthlyAttendanceTrends}
              />
            </ExpandableChart>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Group Participation (Ministry Year)</CardTitle>
            <CardDescription>Active participants by group type</CardDescription>
          </CardHeader>
          <CardContent>
            <ExpandableChart
              title="Group Participation (Ministry Year)"
              description="Active participants by group type"
              expandedChildren={
                <GroupParticipationChart
                  data={data.groupTypeMetrics}
                  height={600}
                  radius={200}
                />
              }
            >
              <GroupParticipationChart data={data.groupTypeMetrics} />
            </ExpandableChart>
          </CardContent>
        </Card>
      </div>

      {/* Year-over-Year Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Year-over-Year Comparison</CardTitle>
          <CardDescription>Performance vs. last ministry year</CardDescription>
        </CardHeader>
        <CardContent>
          <YearOverYearComparison data={data.yearOverYear} />
        </CardContent>
      </Card>

      {/* Community Attendance Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Community Sunday Gathering Attendance (Ministry Year)</CardTitle>
          <CardDescription>Average weekly attendance for each community over the ministry year</CardDescription>
        </CardHeader>
        <CardContent>
          <ExpandableChart
            title="Community Sunday Gathering Attendance (Ministry Year)"
            description="Average weekly attendance for each community over the ministry year"
            expandedChildren={
              <CommunityAttendanceChart
                data={data.communityAttendanceTrends}
                height={600}
              />
            }
          >
            <CommunityAttendanceChart data={data.communityAttendanceTrends} />
          </ExpandableChart>
        </CardContent>
      </Card>

      {/* Small Group Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Small Group Trends (Ministry Year)</CardTitle>
          <CardDescription>Monthly small group participation</CardDescription>
        </CardHeader>
        <CardContent>
          <ExpandableChart
            title="Small Group Trends (Ministry Year)"
            description="Monthly small group participation"
            expandedChildren={
              <SmallGroupTrends data={data.smallGroupTrends} height={600} />
            }
          >
            <SmallGroupTrends data={data.smallGroupTrends} />
          </ExpandableChart>
        </CardContent>
      </Card>

      {/* Debug Info - Development only */}
      {process.env.NODE_ENV === 'development' && (
        <Card>
          <CardHeader>
            <CardTitle>Data Summary</CardTitle>
            <CardDescription>Current dashboard data (for verification)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>Group Types:</strong> {data.groupTypeMetrics.length} types tracked</p>
              <p><strong>Event Types:</strong> {data.eventTypeMetrics.length} types tracked</p>
              <p><strong>Period:</strong> {new Date(data.currentPeriod.periodStart).toLocaleDateString()} - {new Date(data.currentPeriod.periodEnd).toLocaleDateString()}</p>
              <p><strong>Generated:</strong> {new Date(data.generatedAt).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
