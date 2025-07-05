
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StaffAvailability } from "@/types/models";
import { Clock, AlertTriangle, CheckCircle, User, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSmartStaffAllocation } from "@/hooks/staff/enhanced-staff-availability";

interface EnhancedMultiStaffSelectorProps {
  role: "Videographer" | "Photographer";
  staffAvailability: StaffAvailability[];
  selectedStaffIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  excludeStaffIds?: string[];
  disabled?: boolean;
  eventStartTime?: string;
  eventEndTime?: string;
}

export default function EnhancedMultiStaffSelector({
  role,
  staffAvailability,
  selectedStaffIds,
  onSelectionChange,
  excludeStaffIds = [],
  disabled = false,
  eventStartTime,
  eventEndTime
}: EnhancedMultiStaffSelectorProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Filter staff by role and exclude already selected staff from other roles
  const availableStaff = staffAvailability.filter(availability =>
    availability.staff.roles.includes(role) && 
    !excludeStaffIds.includes(availability.staff.id)
  );

  // Only show fully available and partially available staff
  const fullyAvailable = availableStaff.filter(a => a.isFullyAvailable);
  const partiallyAvailable = availableStaff.filter(a => 
    !a.isFullyAvailable && 
    a.availableTimeSlots && 
    a.availableTimeSlots.length > 0
  );

  // Get smart allocation if event times are provided
  const smartAllocation = eventStartTime && eventEndTime 
    ? getSmartStaffAllocation(availableStaff, eventStartTime, eventEndTime)
    : null;

  const handleStaffToggle = (staffId: string) => {
    if (disabled) return;
    
    try {
      if (selectedStaffIds.includes(staffId)) {
        onSelectionChange(selectedStaffIds.filter(id => id !== staffId));
      } else {
        onSelectionChange([...selectedStaffIds, staffId]);
      }
    } catch (error) {
      console.error("Error toggling staff selection:", error);
    }
  };

  const handleSmartSelect = () => {
    try {
      if (smartAllocation && smartAllocation.recommendedStaff.length > 0) {
        onSelectionChange(smartAllocation.recommendedStaff);
      }
    } catch (error) {
      console.error("Error with smart selection:", error);
    }
  };

  const getAvailabilityIcon = (availability: StaffAvailability) => {
    if (availability.isFullyAvailable) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (availability.availableTimeSlots && availability.availableTimeSlots.length > 0) {
      return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    } else {
      return <Clock className="h-4 w-4 text-red-500" />;
    }
  };

  const renderStaffCard = (availability: StaffAvailability) => {
    const { staff } = availability;
    const isSelected = selectedStaffIds.includes(staff.id);
    const isRecommended = smartAllocation?.recommendedStaff.includes(staff.id);
    
    return (
      <Card 
        key={staff.id} 
        className={cn(
          "transition-all duration-200 hover:shadow-md border",
          isSelected && "ring-2 ring-primary",
          isRecommended && "ring-2 ring-blue-400 bg-blue-50 dark:bg-blue-950/30",
          disabled && "opacity-50 cursor-not-allowed",
          !availability.isFullyAvailable && "border-orange-200 bg-orange-50 dark:bg-orange-950/30"
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => handleStaffToggle(staff.id)}
                disabled={disabled}
                className="mt-1"
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {getAvailabilityIcon(availability)}
                <h4 className="font-medium text-sm truncate">{staff.name}</h4>
                {isRecommended && (
                  <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs">
                    <Lightbulb className="h-3 w-3 mr-1" />
                    Smart Pick
                  </Badge>
                )}
              </div>
              
              {/* Show availability status */}
              {availability.isFullyAvailable ? (
                <Badge variant="secondary" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs">
                  Fully Available
                </Badge>
              ) : availability.availableTimeSlots && availability.availableTimeSlots.length > 0 ? (
                <div className="space-y-1">
                  <Badge variant="secondary" className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 text-xs">
                    Partially Available
                  </Badge>
                  <div className="text-xs text-muted-foreground">
                    Available: {availability.availableTimeSlots.map(slot => 
                      `${slot.startTime}-${slot.endTime}`
                    ).join(', ')}
                  </div>
                  {availability.conflictingTimeSlots && availability.conflictingTimeSlots.length > 0 && (
                    <div className="text-xs text-red-600 dark:text-red-400">
                      Conflicts: {availability.conflictingTimeSlots.map(slot => 
                        `${slot.startTime}-${slot.endTime} (${slot.reason})`
                      ).join(', ')}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <User className="h-5 w-5" />
          {role}s
        </h3>
        {smartAllocation && smartAllocation.recommendedStaff.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleSmartSelect}
            className="flex items-center gap-2"
            disabled={disabled}
          >
            <Lightbulb className="h-4 w-4" />
            Smart Select
          </Button>
        )}
      </div>

      {/* Smart allocation summary */}
      {smartAllocation && (
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-800 dark:text-blue-200 flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Smart Allocation Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <p>Coverage: {smartAllocation.totalCoverage}% of event time</p>
              {smartAllocation.coverageGaps.length > 0 && (
                <p className="text-orange-700 dark:text-orange-400">
                  Gaps: {smartAllocation.coverageGaps.map(gap => 
                    `${gap.startTime}-${gap.endTime}`
                  ).join(', ')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <ScrollArea className="h-[400px]">
        <div className="space-y-3">
          {/* Fully Available Staff */}
          {fullyAvailable.length > 0 && (
            <div>
              <div className="text-sm font-medium text-green-700 dark:text-green-300 mb-2 px-1">
                Fully Available ({fullyAvailable.length})
              </div>
              {fullyAvailable.map(renderStaffCard)}
            </div>
          )}

          {/* Partially Available Staff */}
          {partiallyAvailable.length > 0 && (
            <div>
              <div className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-2 px-1">
                Partially Available ({partiallyAvailable.length})
              </div>
              {partiallyAvailable.map(renderStaffCard)}
            </div>
          )}

          {/* No available staff message */}
          {fullyAvailable.length === 0 && partiallyAvailable.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No {role.toLowerCase()}s available for this time slot</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {selectedStaffIds.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Selected: {selectedStaffIds.length} {role.toLowerCase()}{selectedStaffIds.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
