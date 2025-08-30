
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Clock, Plus, Zap } from "lucide-react";
import { StaffAvailability } from "@/types/models";
import { formatTimeSlots, getDetailedConflictReasons } from "./utils";

interface PartiallyAvailableStaffProps {
  partiallyAvailableStaff: StaffAvailability[];
  selectedStaffIds: string[];
  showPartiallyAvailable: boolean;
  setShowPartiallyAvailable: (value: boolean) => void;
  onSmartPick: (staffId: string) => void;
  disabled: boolean;
  canAddMore: boolean;
  eventStartTime?: string;
  eventEndTime?: string;
}

const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

// Algorithm to calculate gap-filling potential
const calculateGapFillingPotential = (
  candidateStaff: StaffAvailability,
  selectedStaff: StaffAvailability[],
  eventStartTime: string,
  eventEndTime: string
): { score: number; gapsFilled: Array<{start: string; end: string}> } => {
  if (!candidateStaff.availableTimeSlots || !eventStartTime || !eventEndTime) {
    return { score: 0, gapsFilled: [] };
  }

  const eventStart = timeToMinutes(eventStartTime);
  const eventEnd = timeToMinutes(eventEndTime);
  const eventDuration = eventEnd - eventStart;

  // Create coverage map from currently selected staff
  const coverageMap: boolean[] = new Array(eventDuration).fill(false);
  
  selectedStaff.forEach(staff => {
    if (staff.isFullyAvailable) {
      coverageMap.fill(true);
    } else if (staff.availableTimeSlots) {
      staff.availableTimeSlots.forEach(slot => {
        const slotStart = Math.max(0, timeToMinutes(slot.startTime) - eventStart);
        const slotEnd = Math.min(eventDuration, timeToMinutes(slot.endTime) - eventStart);
        
        for (let i = slotStart; i < slotEnd; i++) {
          coverageMap[i] = true;
        }
      });
    }
  });

  // Calculate what gaps this candidate could fill
  const candidateCoverage: boolean[] = new Array(eventDuration).fill(false);
  candidateStaff.availableTimeSlots.forEach(slot => {
    const slotStart = Math.max(0, timeToMinutes(slot.startTime) - eventStart);
    const slotEnd = Math.min(eventDuration, timeToMinutes(slot.endTime) - eventStart);
    
    for (let i = slotStart; i < slotEnd; i++) {
      candidateCoverage[i] = true;
    }
  });

  // Find gaps that this candidate could fill
  const gapsFilled: Array<{start: string; end: string}> = [];
  let gapMinutesFilled = 0;
  let continuousGapsFilled = 0;
  let currentGapStart = -1;

  for (let i = 0; i < eventDuration; i++) {
    const isGap = !coverageMap[i];
    const canFillGap = candidateCoverage[i];

    if (isGap && canFillGap) {
      if (currentGapStart === -1) {
        currentGapStart = i;
      }
      gapMinutesFilled++;
    } else if (currentGapStart !== -1) {
      // End of a continuous gap that was being filled
      gapsFilled.push({
        start: minutesToTime(eventStart + currentGapStart),
        end: minutesToTime(eventStart + i)
      });
      continuousGapsFilled++;
      currentGapStart = -1;
    }
  }

  // Handle gap at the end
  if (currentGapStart !== -1) {
    gapsFilled.push({
      start: minutesToTime(eventStart + currentGapStart),
      end: eventEndTime
    });
    continuousGapsFilled++;
  }

  // Scoring algorithm:
  // - Higher score for filling more minutes of gaps
  // - Bonus for filling continuous gaps (better than fragmented coverage)
  // - Penalty for very short fills (less than 30 minutes)
  let score = gapMinutesFilled * 2; // Base score
  score += continuousGapsFilled * 30; // Bonus for continuous coverage
  
  // Bonus for longer continuous fills
  gapsFilled.forEach(gap => {
    const gapDuration = timeToMinutes(gap.end) - timeToMinutes(gap.start);
    if (gapDuration >= 60) score += 20; // 1+ hour bonus
    else if (gapDuration >= 30) score += 10; // 30+ min bonus
    else if (gapDuration < 15) score -= 5; // Penalty for very short fills
  });

  return { score, gapsFilled };
};

export default function PartiallyAvailableStaff({
  partiallyAvailableStaff,
  selectedStaffIds,
  showPartiallyAvailable,
  setShowPartiallyAvailable,
  onSmartPick,
  disabled,
  canAddMore,
  eventStartTime,
  eventEndTime
}: PartiallyAvailableStaffProps) {
  if (partiallyAvailableStaff.length === 0) {
    return null;
  }

  // Get selected staff availability data for gap analysis
  const selectedStaffAvailability = partiallyAvailableStaff.filter(staff => 
    selectedStaffIds.includes(staff.staff.id)
  );

  // Sort partially available staff by gap-filling potential
  const sortedStaff = [...partiallyAvailableStaff]
    .filter(staff => !selectedStaffIds.includes(staff.staff.id))
    .map(staff => {
      const gapAnalysis = eventStartTime && eventEndTime ? 
        calculateGapFillingPotential(staff, selectedStaffAvailability, eventStartTime, eventEndTime) :
        { score: 0, gapsFilled: [] };
      
      return { ...staff, gapAnalysis };
    })
    .sort((a, b) => b.gapAnalysis.score - a.gapAnalysis.score);

  return (
    <Collapsible open={showPartiallyAvailable} onOpenChange={setShowPartiallyAvailable}>
      <CollapsibleTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full justify-between text-orange-700 dark:text-orange-300"
          disabled={disabled}
        >
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Partially Available ({partiallyAvailableStaff.length})
            {selectedStaffIds.length > 0 && (
              <span className="text-xs bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">
                Gap-Optimized
              </span>
            )}
          </div>
          <span className="text-xs">
            {showPartiallyAvailable ? "Hide" : "Show"}
          </span>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 mt-2">
        {sortedStaff.map((staffWithAnalysis) => {
          const availability = staffWithAnalysis;
          const isSelected = selectedStaffIds.includes(availability.staff.id);
          const conflictReasons = getDetailedConflictReasons(availability);
          const { gapAnalysis } = staffWithAnalysis;
          
          return (
            <div key={availability.staff.id} className={`p-3 border rounded-lg ${
              gapAnalysis.score > 50 
                ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' 
                : 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800'
            } ${isSelected ? 'border-blue-300 dark:border-blue-600' : ''}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {isSelected && <div className="w-3 h-3 bg-green-500 rounded-full" />}
                  <span className="font-medium">{availability.staff.name}</span>
                  {gapAnalysis.score > 50 && selectedStaffIds.length > 0 && (
                    <div className="flex items-center gap-1 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                      <Zap className="h-3 w-3" />
                      Gap Filler
                    </div>
                  )}
                </div>
                {!isSelected && canAddMore && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onSmartPick(availability.staff.id)}
                    disabled={disabled}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {availability.availableTimeSlots && (
                <div className="text-sm text-muted-foreground mb-2">
                  <span className="font-medium">Available: </span>
                  {formatTimeSlots(availability.availableTimeSlots)}
                </div>
              )}
              
              {gapAnalysis.gapsFilled.length > 0 && selectedStaffIds.length > 0 && (
                <div className="text-sm text-green-600 dark:text-green-400 mb-2">
                  <span className="font-medium">Can fill gaps: </span>
                  {formatTimeSlots(gapAnalysis.gapsFilled)}
                  <span className="text-xs ml-2 bg-green-100 dark:bg-green-900 px-1 py-0.5 rounded">
                    Score: {gapAnalysis.score}
                  </span>
                </div>
              )}
              
              {availability.conflictingTimeSlots && availability.conflictingTimeSlots.length > 0 && (
                <div className="text-sm text-orange-600 dark:text-orange-400">
                  <span className="font-medium">Conflicts: </span>
                  {conflictReasons}
                </div>
              )}
            </div>
          );
        })}
        
        {selectedStaffIds.length > 0 && (
          <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded border">
            <span className="font-medium">Gap Analysis:</span> Staff are sorted by their ability to fill time gaps left by your current selection. 
            Higher-scored staff can provide better continuous coverage.
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
