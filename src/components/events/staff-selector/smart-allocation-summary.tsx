
import { TrendingUp } from "lucide-react";
import { SmartAllocationResult } from "./types";
import { getCoverageColor } from "./utils";

interface SmartAllocationSummaryProps {
  smartAllocation: SmartAllocationResult;
}

export default function SmartAllocationSummary({ smartAllocation }: SmartAllocationSummaryProps) {
  return (
    <div className="p-4 bg-muted/50 rounded-lg border">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Smart Allocation Summary</span>
      </div>
      <div className="space-y-2">
        <div className="text-sm">
          <span className="text-muted-foreground">Coverage: </span>
          <span className={`font-semibold ${getCoverageColor(smartAllocation.coveragePercentage)}`}>
            {smartAllocation.coveragePercentage}% of event time
          </span>
        </div>
        {smartAllocation.gaps.length > 0 && (
          <div className="text-sm">
            <span className="text-muted-foreground">Gaps: </span>
            <span className="text-orange-600 dark:text-orange-400 font-medium">
              {smartAllocation.gaps.map(gap => `${gap.start}-${gap.end}`).join(", ")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
