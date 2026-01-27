'use client';

import { ReactNode, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Maximize2 } from 'lucide-react';

interface ExpandableChartProps {
  title: string;
  description?: string;
  children: ReactNode;
  expandedChildren?: ReactNode;
}

export function ExpandableChart({
  title,
  description,
  children,
  expandedChildren
}: ExpandableChartProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <div className="relative group">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => setIsExpanded(true)}
          aria-label="Expand chart"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
        <div className="cursor-pointer" onClick={() => setIsExpanded(true)}>
          {children}
        </div>
      </div>

      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </DialogHeader>
          <div className="mt-4">
            {expandedChildren || children}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
