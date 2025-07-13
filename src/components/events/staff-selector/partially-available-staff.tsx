
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Plus, Lightbulb } from "lucide-react";
import { StaffAvailability } from "@/types/models";
import { formatTimeSlots, getConflictReason } from "./utils";

interface PartiallyAvailableStaffProps {
  partiallyAvailableStaff: StaffAvailability[];
  selectedStaffIds: string[];
  showPartiallyAvailable: boolean;
  setShowPartiallyAvailable: (value: boolean) => void;
  onSmartPick: (staffId: string) => void;
  disabled: boolean;
  canAddMore: boolean;
}

export default function PartiallyAvailableStaff({
  partiallyAvailableStaff,
  selectedStaffIds,
  showPartiallyAvailable,
  setShowPartiallyAvailable,
  onSmartPick,
  disabled,
  canAddMore
}: PartiallyAvailableStaffProps) {
  if (partiallyAvailableStaff.length === 0) {
    return null;
  }

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
          </div>
          <span className="text-xs">
            {showPartiallyAvailable ? "Hide" : "Show"}
          </span>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 mt-2">
        {partiallyAvailableStaff.map((availability) => {
          const isSelected = selectedStaffIds.includes(availability.staff.id);
          
          return (
            <div key={availability.staff.id} className={`p-3 border rounded-lg bg-orange-50 dark:bg-orange-950 ${isSelected ? 'border-blue-300 dark:border-blue-600' : 'border-orange-200 dark:border-orange-800'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {isSelected && <div className="w-3 h-3 bg-green-500 rounded-full" />}
                  <span className="font-medium">{availability.staff.name}</span>
                  <Badge variant="outline" className="text-xs">
                    Partially Available
                  </Badge>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs px-2 py-1 h-6 bg-blue-500 text-white hover:bg-blue-600"
                    onClick={() => onSmartPick(availability.staff.id)}
                    disabled={disabled || isSelected}
                  >
                    <Lightbulb className="h-3 w-3 mr-1" />
                    Smart Pick
                  </Button>
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
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Available: </span>
                  {formatTimeSlots(availability.availableTimeSlots)}
                </div>
              )}
              {availability.conflictingTimeSlots && availability.conflictingTimeSlots.length > 0 && (
                <div className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                  <span className="font-medium">Conflicts: </span>
                  {getConflictReason(availability)}
                </div>
              )}
            </div>
          );
        })}
      </CollapsibleContent>
    </Collapsible>
  );
}
