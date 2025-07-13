
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Camera, Video, UserX, Clock, TrendingUp, Lightbulb } from "lucide-react";
import { StaffAvailability, StaffRole } from "@/types/models";
import { useStaff } from "@/hooks/use-staff";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getSmartStaffAllocation } from "@/hooks/staff/enhanced-staff-availability";

interface EnhancedMultiStaffSelectorProps {
  role: StaffRole;
  staffAvailability: StaffAvailability[];
  selectedStaffIds: string[];
  onSelectionChange: (staffIds: string[]) => void;
  maxSelection?: number;
  disabled?: boolean;
  excludeStaffIds?: string[];
  eventStartTime?: string;
  eventEndTime?: string;
}

export default function EnhancedMultiStaffSelector({
  role,
  staffAvailability,
  selectedStaffIds,
  onSelectionChange,
  maxSelection = 3,
  disabled = false,
  excludeStaffIds = [],
  eventStartTime,
  eventEndTime
}: EnhancedMultiStaffSelectorProps) {
  const { staff } = useStaff();
  const [pendingSelection, setPendingSelection] = useState<string>("");
  const [showPartiallyAvailable, setShowPartiallyAvailable] = useState(false);

  const handleAddStaff = () => {
    if (pendingSelection) {
      if (pendingSelection === "none") {
        onSelectionChange([]);
      } else if (!selectedStaffIds.includes(pendingSelection)) {
        const newSelection = [...selectedStaffIds, pendingSelection];
        onSelectionChange(newSelection);
      }
      setPendingSelection("");
    }
  };

  const handleRemoveStaff = (staffId: string) => {
    const newSelection = selectedStaffIds.filter(id => id !== staffId);
    onSelectionChange(newSelection);
  };

  const handleSmartPick = (staffId: string) => {
    if (!selectedStaffIds.includes(staffId)) {
      const newSelection = [...selectedStaffIds, staffId];
      onSelectionChange(newSelection);
    }
  };

  const getStaffName = (staffId: string) => {
    const staffMember = staff?.find(s => s.id === staffId);
    return staffMember?.name || "Unknown Staff";
  };

  // Filter staff by role and availability - ONLY show available staff (fully + partially)
  const roleStaff = staffAvailability.filter(availability => 
    availability.staff.roles?.includes(role) && 
    !excludeStaffIds.includes(availability.staff.id) &&
    (availability.isFullyAvailable || (availability.availableTimeSlots && availability.availableTimeSlots.length > 0))
  );

  const fullyAvailableStaff = roleStaff.filter(s => s.isFullyAvailable);
  const partiallyAvailableStaff = roleStaff.filter(s => 
    !s.isFullyAvailable && s.availableTimeSlots && s.availableTimeSlots.length > 0
  );

  const canAddMore = selectedStaffIds.length < maxSelection;
  const roleIcon = role === "Videographer" ? Video : Camera;
  const RoleIcon = roleIcon;
  const hasNoAssignment = selectedStaffIds.length === 0;

  const formatTimeSlots = (timeSlots: Array<{startTime: string; endTime: string}>) => {
    return timeSlots.map(slot => `${slot.startTime}-${slot.endTime}`).join(", ");
  };

  const getConflictReason = (availability: StaffAvailability) => {
    if (availability.conflictingTimeSlots && availability.conflictingTimeSlots.length > 0) {
      return availability.conflictingTimeSlots[0].reason;
    }
    return "Schedule conflict";
  };

  // Enhanced smart allocation with gap detection
  const getEnhancedSmartAllocation = () => {
    if (!eventStartTime || !eventEndTime || selectedStaffIds.length === 0) return null;
    
    const eventStart = timeToMinutes(eventStartTime);
    const eventEnd = timeToMinutes(eventEndTime);
    const eventDuration = eventEnd - eventStart;
    
    // Get all selected staff availability
    const selectedStaffAvailability = roleStaff.filter(s => selectedStaffIds.includes(s.staff.id));
    
    // Create coverage map
    const coverageMap: boolean[] = new Array(eventDuration).fill(false);
    
    selectedStaffAvailability.forEach(availability => {
      if (availability.isFullyAvailable) {
        // Full coverage
        coverageMap.fill(true);
      } else if (availability.availableTimeSlots) {
        availability.availableTimeSlots.forEach(slot => {
          const slotStart = Math.max(0, timeToMinutes(slot.startTime) - eventStart);
          const slotEnd = Math.min(eventDuration, timeToMinutes(slot.endTime) - eventStart);
          
          for (let i = slotStart; i < slotEnd; i++) {
            coverageMap[i] = true;
          }
        });
      }
    });
    
    const coveredMinutes = coverageMap.filter(Boolean).length;
    const coveragePercentage = Math.round((coveredMinutes / eventDuration) * 100);
    
    // Find gaps
    const gaps: Array<{start: string; end: string}> = [];
    let gapStart = -1;
    
    for (let i = 0; i < coverageMap.length; i++) {
      if (!coverageMap[i] && gapStart === -1) {
        gapStart = i;
      } else if (coverageMap[i] && gapStart !== -1) {
        gaps.push({
          start: minutesToTime(eventStart + gapStart),
          end: minutesToTime(eventStart + i)
        });
        gapStart = -1;
      }
    }
    
    // Handle gap at the end
    if (gapStart !== -1) {
      gaps.push({
        start: minutesToTime(eventStart + gapStart),
        end: eventEndTime
      });
    }
    
    return { coveragePercentage, gaps };
  };

  const smartAllocation = getEnhancedSmartAllocation();

  const getCoverageColor = (coverage: number) => {
    if (coverage >= 90) return "text-green-600 dark:text-green-400";
    if (coverage >= 70) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  // Helper function for time calculations
  const timeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="flex items-center">
          <RoleIcon className="h-4 w-4 mr-2 text-primary" />
          {role} (Max {maxSelection})
        </Label>
        
        {/* Smart Select Button */}
        {roleStaff.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => {
              // Smart select logic - pick the best available staff
              const bestOption = fullyAvailableStaff[0] || partiallyAvailableStaff[0];
              if (bestOption && !selectedStaffIds.includes(bestOption.staff.id)) {
                handleSmartPick(bestOption.staff.id);
              }
            }}
            disabled={disabled || hasNoAssignment === false}
          >
            <Lightbulb className="h-4 w-4" />
            Smart Select
          </Button>
        )}
      </div>
      
      {/* Smart Allocation Summary */}
      {smartAllocation && selectedStaffIds.length > 0 && (
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
      )}
      
      {/* Selected Staff Display */}
      {selectedStaffIds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedStaffIds.map((staffId) => {
            const availability = roleStaff.find(s => s.staff.id === staffId);
            const isPartial = availability && !availability.isFullyAvailable && availability.availableTimeSlots?.length > 0;
            
            return (
              <Badge 
                key={`${role}-${staffId}`} 
                variant={isPartial ? "secondary" : "default"} 
                className={`flex items-center gap-1 ${isPartial ? "border-orange-300 bg-orange-50 text-orange-800 dark:bg-orange-900 dark:text-orange-200" : ""}`}
              >
                {isPartial && <Clock className="h-3 w-3" />}
                {getStaffName(staffId)}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => handleRemoveStaff(staffId)}
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Show "None assigned" badge when no staff is selected */}
      {hasNoAssignment && (
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <UserX className="h-3 w-3" />
            None assigned
          </Badge>
        </div>
      )}

      {/* Add New Staff - Fully Available */}
      {(canAddMore || hasNoAssignment) && fullyAvailableStaff.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-green-700 dark:text-green-300">
            ✓ Fully Available ({fullyAvailableStaff.length})
          </div>
          <div className="flex gap-2">
            <Select 
              value={pendingSelection} 
              onValueChange={setPendingSelection}
              disabled={disabled}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={`Select ${role.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <div className="flex items-center gap-2">
                    <UserX className="h-4 w-4" />
                    None (no {role.toLowerCase()} needed)
                  </div>
                </SelectItem>
                {fullyAvailableStaff
                  .filter(availability => !selectedStaffIds.includes(availability.staff.id))
                  .map((availability) => (
                    <SelectItem key={availability.staff.id} value={availability.staff.id}>
                      {availability.staff.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddStaff}
              disabled={!pendingSelection || disabled}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Partially Available Staff */}
      {partiallyAvailableStaff.length > 0 && (
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
                      {/* Smart Pick Button */}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs px-2 py-1 h-6 bg-blue-500 text-white hover:bg-blue-600"
                        onClick={() => handleSmartPick(availability.staff.id)}
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
                        onClick={() => handleSmartPick(availability.staff.id)}
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
      )}

      {/* Status Messages */}
      {roleStaff.length === 0 && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          No {role.toLowerCase()}s available for this time slot
        </p>
      )}
      
      {selectedStaffIds.length >= maxSelection && (
        <p className="text-sm text-muted-foreground">
          Maximum {role.toLowerCase()}s selected
        </p>
      )}
    </div>
  );
}
