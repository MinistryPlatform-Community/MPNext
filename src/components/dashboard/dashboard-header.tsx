'use client';

import { useState, useTransition } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { refreshDashboardCache } from './actions';
import { useRouter } from 'next/navigation';

export function DashboardHeader() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const handleRefresh = async () => {
    startTransition(async () => {
      const result = await refreshDashboardCache();
      if (result.success) {
        setLastRefresh(result.timestamp);
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold tracking-tight">Executive Dashboard</h1>
        <Button
          onClick={handleRefresh}
          disabled={isPending}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
          {isPending ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">
          Worship Services attendance and group participation metrics for ministry year (September - May)
        </p>
        {lastRefresh && (
          <p className="text-xs text-muted-foreground">
            Last refreshed: {lastRefresh.toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  );
}
