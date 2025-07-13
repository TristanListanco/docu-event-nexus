
import { StaffAvailability, StaffRole } from "@/types/models";

export interface EnhancedMultiStaffSelectorProps {
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

export interface SmartAllocationResult {
  coveragePercentage: number;
  gaps: Array<{start: string; end: string}>;
}
