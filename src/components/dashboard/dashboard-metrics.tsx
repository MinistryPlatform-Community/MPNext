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
  showCompare?: boolean;
  isSingleMonth?: boolean;
}

export function DashboardMetrics({ data, showCompare = true, isSingleMonth = false }: DashboardMetricsProps) {
  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          title="Avg In-Person Attendance"
          value={data.currentPeriod.averageInPersonAttendance}
          previousValue={showCompare ? data.previousPeriod.averageInPersonAttendance : undefined}
          format="number"
        />
        <MetricCard
          title="Avg Online Attendance"
          value={data.currentPeriod.averageOnlineAttendance}
          previousValue={showCompare ? data.previousPeriod.averageOnlineAttendance : undefined}
          format="number"
        />
        <MetricCard
          title="Active Communities and Small Groups"
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
          previousValue={showCompare ? data.baptismsPreviousYear : undefined}
          format="number"
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Worship Service Attendance</CardTitle>
            <CardDescription>
              {isSingleMonth ? 'Weekly attendance' : `Monthly average attendance${showCompare ? ' comparison' : ''}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExpandableChart
              title="Worship Service Attendance"
              description={isSingleMonth ? 'Weekly attendance' : `Monthly average attendance${showCompare ? ' comparison' : ''}`}
              expandedChildren={
                <AttendanceChart
                  currentYear={data.monthlyAttendanceTrends}
                  previousYear={showCompare ? data.previousYearMonthlyAttendanceTrends : []}
                  height={600}
                />
              }
            >
              <AttendanceChart
                currentYear={data.monthlyAttendanceTrends}
                previousYear={showCompare ? data.previousYearMonthlyAttendanceTrends : []}
              />
            </ExpandableChart>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Small Group Trends</CardTitle>
            <CardDescription>Monthly small group participation{showCompare ? ' comparison' : ''}</CardDescription>
          </CardHeader>
          <CardContent>
            <ExpandableChart
              title="Small Group Trends"
              description={`Monthly small group participation${showCompare ? ' comparison' : ''}`}
              expandedChildren={
                <SmallGroupTrends
                  data={data.smallGroupTrends}
                  previousYear={showCompare ? data.previousYearSmallGroupTrends : []}
                  height={600}
                />
              }
            >
              <SmallGroupTrends
                data={data.smallGroupTrends}
                previousYear={showCompare ? data.previousYearSmallGroupTrends : []}
              />
            </ExpandableChart>
          </CardContent>
        </Card>
      </div>

      {/* Community Attendance Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Community Sunday Gathering Attendance</CardTitle>
          <CardDescription>
            {isSingleMonth ? 'Weekly attendance for each community' : 'Average weekly attendance for each community'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExpandableChart
            title="Community Sunday Gathering Attendance"
            description={isSingleMonth ? 'Weekly attendance for each community' : 'Average weekly attendance for each community'}
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

      {/* Group Participation + Period Comparison */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Group Participation</CardTitle>
            <CardDescription>Active participants by group type</CardDescription>
          </CardHeader>
          <CardContent>
            <ExpandableChart
              title="Group Participation"
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

        {showCompare && (
          <Card>
            <CardHeader>
              <CardTitle>Period Comparison</CardTitle>
              <CardDescription>Performance vs. previous period</CardDescription>
            </CardHeader>
            <CardContent>
              <YearOverYearComparison data={data.yearOverYear} />
            </CardContent>
          </Card>
        )}
      </div>

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
