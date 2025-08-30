
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Clock, UserX, CheckCircle, Lock } from "lucide-react";
import { StaffAvailability } from "@/types/models";

interface SelectedStaffDisplayProps {
  selectedStaffIds: string[];
  roleStaff: StaffAvailability[];
  role: string;
  disabled: boolean;
  onRemoveStaff: (staffId: string) => void;
  getStaffName: (staffId: string) => string;
  confirmedStaffIds?: string[]; // New prop for confirmed staff
}

export default function SelectedStaffDisplay({
  selectedStaffIds,
  roleStaff,
  role,
  disabled,
  onRemoveStaff,
  getStaffName,
  confirmedStaffIds = []
}: SelectedStaffDisplayProps) {
  const hasNoAssignment = selectedStaffIds.length === 0;

  if (hasNoAssignment) {
    return (
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="flex items-center gap-1">
          <UserX className="h-3 w-3" />
          None assigned
        </Badge>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {selectedStaffIds.map((staffId) => {
        const availability = roleStaff.find(s => s.staff.id === staffId);
        const isPartial = availability && !availability.isFullyAvailable && availability.availableTimeSlots?.length > 0;
        const isConfirmed = confirmedStaffIds.includes(staffId);
        
        return (
          <Badge 
            key={`${role}-${staffId}`} 
            variant={isConfirmed ? "default" : isPartial ? "secondary" : "default"} 
            className={`flex items-center gap-1 ${
              isConfirmed 
                ? "border-green-300 bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-200" 
                : isPartial 
                ? "border-orange-300 bg-orange-50 text-orange-800 dark:bg-orange-900 dark:text-orange-200" 
                : ""
            }`}
          >
            {isConfirmed ? <CheckCircle className="h-3 w-3" /> : isPartial ? <Clock className="h-3 w-3" /> : null}
            {getStaffName(staffId)}
            {isConfirmed ? (
              <Lock className="h-3 w-3 text-green-600" />
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => onRemoveStaff(staffId)}
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </Badge>
        );
      })}
    </div>
  );
}
