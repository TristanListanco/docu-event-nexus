
import { useState, useEffect } from "react";
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
  staffAvailability = [],
  selectedStaffIds = [],
  onSelectionChange,
  excludeStaffIds = [],
  disabled = false,
  eventStartTime,
  eventEndTime
}: EnhancedMultiStaffSelectorProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentCoverage, setCurrentCoverage] = useState(0);
  
  const safeStaffAvailability = Array.isArray(staffAvailability) ? staffAvailability : [];
  
  const availableStaff = safeStaffAvailability.filter(availability => {
    if (!availability?.staff?.roles?.includes(role)) return false;
    if (excludeStaffIds.includes(availability.staff.id)) return false;
    
    // Only show fully available and partially available staff
    // Hide completely unavailable staff (including those on leave)
    const isFullyAvailable = availability.isFullyAvailable === true;
    const isPartiallyAvailable = availability.isFullyAvailable === false && 
      availability.availableTimeSlots && 
      Array.isArray(availability.availableTimeSlots) &&
      availability.availableTimeSlots.length > 0;
    
    return isFullyAvailable || isPartiallyAvailable;
  });

  // Show fully available and partially available staff separately
  const fullyAvailable = availableStaff.filter(a => a?.isFullyAvailable === true);
  const partiallyAvailable = availableStaff.filter(a => 
    a?.isFullyAvailable === false && 
    a?.availableTimeSlots && 
    Array.isArray(a.availableTimeSlots) &&
    a.availableTimeSlots.length > 0
  );

  // Get smart allocation if event times are provided
  const smartAllocation = eventStartTime && eventEndTime 
    ? getSmartStaffAllocation(availableStaff, eventStartTime, eventEndTime)
    : null;

  // Calculate current coverage based on selected staff
  useEffect(() => {
    if (!eventStartTime || !eventEndTime || selectedStaffIds.length === 0) {
      setCurrentCoverage(0);
      return;
    }

    const selectedStaff = availableStaff.filter(a => selectedStaffIds.includes(a.staff.id));
    if (selectedStaff.length === 0) {
      setCurrentCoverage(0);
      return;
    }

    // If any selected staff is fully available, coverage is 100%
    if (selectedStaff.some(s => s.isFullyAvailable)) {
      setCurrentCoverage(100);
      return;
    }

    // Calculate coverage for partially available staff
    const eventDuration = timeToMinutes(eventEndTime) - timeToMinutes(eventStartTime);
    const coveredSlots = selectedStaff.flatMap(s => s.availableTimeSlots || []);
    const mergedSlots = mergeTimeSlots(coveredSlots);
    const totalCoveredTime = mergedSlots.reduce((sum, slot) => 
      sum + (timeToMinutes(slot.endTime) - timeToMinutes(slot.startTime)), 0);
    
    setCurrentCoverage(Math.round((totalCoveredTime / eventDuration) * 100));
  }, [selectedStaffIds, availableStaff, eventStartTime, eventEndTime]);

  // Helper functions for time calculations
  const timeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const mergeTimeSlots = (slots: Array<{ startTime: string; endTime: string }>): Array<{ startTime: string; endTime: string }> => {
    if (slots.length === 0) return [];
    
    const sorted = slots.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    const merged: Array<{ startTime: string; endTime: string }> = [sorted[0]];
    
    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i];
      const last = merged[merged.length - 1];
      
      if (timeToMinutes(current.startTime) <= timeToMinutes(last.endTime)) {
        last.endTime = timeToMinutes(current.endTime) > timeToMinutes(last.endTime) 
          ? current.endTime 
          : last.endTime;
      } else {
        merged.push(current);
      }
    }
    
    return merged;
  };

  const handleStaffToggle = (staffId: string) => {
    if (disabled || !staffId) return;
    
    try {
      const safeSelectedIds = Array.isArray(selectedStaffIds) ? selectedStaffIds : [];
      const selectedStaff = availableStaff.find(s => s.staff.id === staffId);
      
      if (safeSelectedIds.includes(staffId)) {
        // Remove staff
        onSelectionChange(safeSelectedIds.filter(id => id !== staffId));
      } else {
        // Add staff - check for conflicts
        const currentlySelected = availableStaff.filter(s => safeSelectedIds.includes(s.staff.id));
        
        if (currentlySelected.length > 0 && selectedStaff) {
          const hasFullyAvailable = currentlySelected.some(s => s.isFullyAvailable);
          const hasPartiallyAvailable = currentlySelected.some(s => !s.isFullyAvailable);
          
          // Prevent mixing fully and partially available staff
          if ((hasFullyAvailable && !selectedStaff.isFullyAvailable) || 
              (hasPartiallyAvailable && selectedStaff.isFullyAvailable)) {
            // Clear previous selections and select only the new one
            onSelectionChange([staffId]);
            return;
          }
        }
        
        onSelectionChange([...safeSelectedIds, staffId]);
      }
    } catch (error) {
      console.error("Error toggling staff selection:", error);
    }
  };

  const handleSmartSelect = () => {
    try {
      if (smartAllocation && Array.isArray(smartAllocation.recommendedStaff) && smartAllocation.recommendedStaff.length > 0) {
        onSelectionChange(smartAllocation.recommendedStaff);
      }
    } catch (error) {
      console.error("Error with smart selection:", error);
    }
  };

  const getAvailabilityIcon = (availability: StaffAvailability) => {
    if (!availability) return <Clock className="h-4 w-4 text-red-500" />;
    
    if (availability.isFullyAvailable) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (availability.availableTimeSlots && Array.isArray(availability.availableTimeSlots) && availability.availableTimeSlots.length > 0) {
      return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    } else {
      return <Clock className="h-4 w-4 text-red-500" />;
    }
  };

  const renderStaffCard = (availability: StaffAvailability) => {
    if (!availability || !availability.staff) return null;
    
    const { staff } = availability;
    const safeSelectedIds = Array.isArray(selectedStaffIds) ? selectedStaffIds : [];
    const isSelected = safeSelectedIds.includes(staff.id);
    const isRecommended = smartAllocation?.recommendedStaff?.includes(staff.id);
    
    return (
      <Card 
        key={staff.id} 
        className={cn(
          "transition-all duration-200 hover:shadow-md border",
          isSelected && "border-primary border-2",
          disabled && "opacity-50 cursor-not-allowed"
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
                  <Badge variant="secondary" className="text-xs">
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
              ) : (
                <div className="space-y-1">
                  <Badge variant="secondary" className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 text-xs">
                    Partially Available
                  </Badge>
                  <div className="text-xs text-muted-foreground">
                    Available: {availability.availableTimeSlots?.map(slot => 
                      `${slot.startTime}-${slot.endTime}`
                    ).join(', ')}
                  </div>
                  {availability.conflictingTimeSlots && Array.isArray(availability.conflictingTimeSlots) && availability.conflictingTimeSlots.length > 0 && (
                    <div className="text-xs text-red-600 dark:text-red-400">
                      Conflicts: {availability.conflictingTimeSlots.map(slot => 
                        `${slot.startTime}-${slot.endTime} (${slot.reason})`
                      ).join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const safeSelectedIds = Array.isArray(selectedStaffIds) ? selectedStaffIds : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <User className="h-5 w-5" />
          {role}s
        </h3>
        {smartAllocation && Array.isArray(smartAllocation.recommendedStaff) && smartAllocation.recommendedStaff.length > 0 && (
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

      {/* Current coverage summary */}
      {safeSelectedIds.length > 0 && (
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-800 dark:text-blue-200 flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Current Coverage
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p>Coverage: {currentCoverage}% of event time</p>
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

      {safeSelectedIds.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Selected: {safeSelectedIds.length} {role.toLowerCase()}{safeSelectedIds.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
