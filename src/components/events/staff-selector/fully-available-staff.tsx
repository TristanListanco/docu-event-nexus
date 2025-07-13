
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, UserX } from "lucide-react";
import { StaffAvailability } from "@/types/models";

interface FullyAvailableStaffProps {
  fullyAvailableStaff: StaffAvailability[];
  selectedStaffIds: string[];
  pendingSelection: string;
  setPendingSelection: (value: string) => void;
  onAddStaff: () => void;
  role: string;
  disabled: boolean;
  canAddMore: boolean;
  hasNoAssignment: boolean;
}

export default function FullyAvailableStaff({
  fullyAvailableStaff,
  selectedStaffIds,
  pendingSelection,
  setPendingSelection,
  onAddStaff,
  role,
  disabled,
  canAddMore,
  hasNoAssignment
}: FullyAvailableStaffProps) {
  if (!((canAddMore || hasNoAssignment) && fullyAvailableStaff.length > 0)) {
    return null;
  }

  return (
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
          onClick={onAddStaff}
          disabled={!pendingSelection || disabled}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
