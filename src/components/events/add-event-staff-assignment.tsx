
import { AlertCircle } from "lucide-react";
import { StaffAvailability } from "@/types/models";
import EnhancedMultiStaffSelector from "@/components/events/enhanced-multi-staff-selector";

interface AddEventStaffAssignmentProps {
  canSelectStaff: boolean;
  staffAvailabilityMode: string;
  staffAvailability: StaffAvailability[];
  selectedVideographers: string[];
  setSelectedVideographers: (ids: string[]) => void;
  selectedPhotographers: string[];
  setSelectedPhotographers: (ids: string[]) => void;
  timeValidationError: string;
}

export default function AddEventStaffAssignment({
  canSelectStaff,
  staffAvailabilityMode,
  staffAvailability,
  selectedVideographers,
  setSelectedVideographers,
  selectedPhotographers,
  setSelectedPhotographers,
  timeValidationError
}: AddEventStaffAssignmentProps) {
  const getStaffAvailabilityDescription = () => {
    switch (staffAvailabilityMode) {
      case "ignore":
        return "Showing all staff members (schedule conflicts ignored)";
      case "ccs":
        return "Showing staff members available for the selected time slot (CCS classes suspended)";
      default:
        return "Showing only staff members available for the selected time slot";
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Staff Assignment</h3>
      <div className="bg-muted/20 p-4 rounded-lg border space-y-4">
        {!canSelectStaff && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm font-medium">
                {timeValidationError ? "Invalid time range" : "Date and time required"}
              </p>
            </div>
            <p className="text-sm text-amber-700 mt-1">
              {timeValidationError 
                ? "Please fix the time validation error to see available staff for assignment."
                : "Please select date and time to see available staff"
              }
            </p>
          </div>
        )}
        
        {canSelectStaff && (
          <p className="text-sm text-muted-foreground">
            {getStaffAvailabilityDescription()}
          </p>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <EnhancedMultiStaffSelector
            role="Videographer"
            staffAvailability={staffAvailability}
            selectedStaffIds={selectedVideographers}
            onSelectionChange={setSelectedVideographers}
            excludeStaffIds={selectedPhotographers}
            disabled={!canSelectStaff}
          />
          
          <EnhancedMultiStaffSelector
            role="Photographer"
            staffAvailability={staffAvailability}
            selectedStaffIds={selectedPhotographers}
            onSelectionChange={setSelectedPhotographers}
            excludeStaffIds={selectedVideographers}
            disabled={!canSelectStaff}
          />
        </div>
      </div>
    </div>
  );
}
