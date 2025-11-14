import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ToolHeaderProps {
  title: string;
  infoContent?: React.ReactNode;
}

export function ToolHeader({ title, infoContent }: ToolHeaderProps) {
  return (
    <div className="bg-slate-700 text-white px-6 py-4 flex items-center justify-between">
      <h1 className="text-xl font-semibold">{title}</h1>
      {infoContent && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="rounded-full w-8 h-8 flex items-center justify-center hover:bg-slate-600 transition-colors"
                aria-label="Information"
              >
                <Info className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              {infoContent}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
