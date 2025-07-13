
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Camera, Video, UserX, Clock, TrendingUp } from "lucide-react";
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

  const getStaffName = (staffId: string) => {
    const staffMember = staff?.find(s => s.id === staffId);
    return staffMember?.name || "Unknown Staff";
  };

  // Filter staff by role and availability - REMOVE UNAVAILABLE STAFF
  const roleStaff = staffAvailability.filter(availability => 
    availability.staff.roles?.includes(role) && 
    !excludeStaffIds.includes(availability.staff.id)
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

  // Smart allocation summary
  const smartAllocation = eventStartTime && eventEndTime 
    ? getSmartStaffAllocation(roleStaff, eventStartTime, eventEndTime)
    : null;

  const getCoverageColor = (coverage: number) => {
    if (coverage >= 90) return "text-green-600 dark:text-green-400";
    if (coverage >= 70) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="space-y-3">
      <Label className="flex items-center">
        <RoleIcon className="h-4 w-4 mr-2 text-primary" />
        {role} (Max {maxSelection})
      </Label>
      
      {/* Smart Allocation Summary */}
      {smartAllocation && selectedStaffIds.length > 0 && (
        <div className="p-3 bg-muted/50 rounded-lg border">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Coverage Analysis</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Current coverage: </span>
            <span className={`font-semibold ${getCoverageColor(smartAllocation.coverage)}`}>
              {smartAllocation.coverage}%
            </span>
          </div>
          {smartAllocation.coverage < 100 && (
            <p className="text-xs text-muted-foreground mt-1">
              Consider adding more staff or selecting different time slots for full coverage
            </p>
          )}
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
            {partiallyAvailableStaff.map((availability) => (
              <div key={availability.staff.id} className="p-3 border rounded-lg bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{availability.staff.name}</span>
                    <Badge variant="outline" className="text-xs">
                      Partial
                    </Badge>
                  </div>
                  {!selectedStaffIds.includes(availability.staff.id) && canAddMore && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newSelection = [...selectedStaffIds, availability.staff.id];
                        onSelectionChange(newSelection);
                      }}
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
            ))}
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
