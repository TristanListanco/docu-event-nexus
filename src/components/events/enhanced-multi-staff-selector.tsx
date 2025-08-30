
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Camera, Video, Lightbulb } from "lucide-react";
import { useStaff } from "@/hooks/use-staff";
import { EnhancedMultiStaffSelectorProps } from "./staff-selector/types";
import { getEnhancedSmartAllocation } from "./staff-selector/utils";
import SmartAllocationSummary from "./staff-selector/smart-allocation-summary";
import SelectedStaffDisplay from "./staff-selector/selected-staff-display";
import FullyAvailableStaff from "./staff-selector/fully-available-staff";
import PartiallyAvailableStaff from "./staff-selector/partially-available-staff";

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

  // Filter staff by role and availability
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

  // Enhanced smart allocation with gap detection
  const smartAllocation = getEnhancedSmartAllocation(
    selectedStaffIds,
    roleStaff,
    eventStartTime,
    eventEndTime
  );

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
        <SmartAllocationSummary smartAllocation={smartAllocation} />
      )}
      
      {/* Selected Staff Display */}
      <SelectedStaffDisplay
        selectedStaffIds={selectedStaffIds}
        roleStaff={roleStaff}
        role={role}
        disabled={disabled}
        onRemoveStaff={handleRemoveStaff}
        getStaffName={getStaffName}
      />

      {/* Add New Staff - Fully Available */}
      <FullyAvailableStaff
        fullyAvailableStaff={fullyAvailableStaff}
        selectedStaffIds={selectedStaffIds}
        pendingSelection={pendingSelection}
        setPendingSelection={setPendingSelection}
        onAddStaff={handleAddStaff}
        role={role}
        disabled={disabled}
        canAddMore={canAddMore}
        hasNoAssignment={hasNoAssignment}
      />

      {/* Partially Available Staff with Gap Analysis */}
      <PartiallyAvailableStaff
        partiallyAvailableStaff={partiallyAvailableStaff}
        selectedStaffIds={selectedStaffIds}
        showPartiallyAvailable={showPartiallyAvailable}
        setShowPartiallyAvailable={setShowPartiallyAvailable}
        onSmartPick={handleSmartPick}
        disabled={disabled}
        canAddMore={canAddMore}
        eventStartTime={eventStartTime}
        eventEndTime={eventEndTime}
      />

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
