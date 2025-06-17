
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Camera, Video, UserX } from "lucide-react";
import { StaffMember, StaffRole } from "@/types/models";

interface MultiStaffSelectorProps {
  role: StaffRole;
  availableStaff: StaffMember[];
  selectedStaffIds: string[];
  onSelectionChange: (staffIds: string[]) => void;
  maxSelection?: number;
  disabled?: boolean;
  excludeStaffIds?: string[]; // Staff IDs to exclude from selection
}

export default function MultiStaffSelector({
  role,
  availableStaff,
  selectedStaffIds,
  onSelectionChange,
  maxSelection = 3,
  disabled = false,
  excludeStaffIds = []
}: MultiStaffSelectorProps) {
  const [pendingSelection, setPendingSelection] = useState<string>("");

  const handleAddStaff = () => {
    if (pendingSelection) {
      if (pendingSelection === "none") {
        // Clear all selections when "none" is selected
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
    const staff = availableStaff.find(s => s.id === staffId);
    return staff?.name || "Unknown Staff";
  };

  const canAddMore = selectedStaffIds.length < maxSelection;
  
  // Filter available staff to exclude those already selected in other roles AND current role
  const availableForSelection = availableStaff.filter(staff => 
    !selectedStaffIds.includes(staff.id) && !excludeStaffIds.includes(staff.id)
  );

  const roleIcon = role === "Videographer" ? Video : Camera;
  const RoleIcon = roleIcon;

  // Check if no staff is assigned
  const hasNoAssignment = selectedStaffIds.length === 0;

  return (
    <div className="space-y-3">
      <Label className="flex items-center">
        <RoleIcon className="h-4 w-4 mr-2 text-primary" />
        {role} (Max {maxSelection})
      </Label>
      
      {/* Selected Staff Display */}
      {selectedStaffIds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedStaffIds.map((staffId) => (
            <Badge key={`${role}-${staffId}`} variant="secondary" className="flex items-center gap-1">
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
          ))}
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

      {/* Add New Staff */}
      {(canAddMore || hasNoAssignment) && (
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
              {availableForSelection.map((staff) => (
                <SelectItem key={staff.id} value={staff.id}>
                  {staff.name}
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
      )}

      {/* Status Messages */}
      {availableForSelection.length === 0 && selectedStaffIds.length === 0 && (
        <p className="text-sm text-amber-500">
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
