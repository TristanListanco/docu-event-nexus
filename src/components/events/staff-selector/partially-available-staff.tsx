import { useMemo } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, AlertCircle } from "lucide-react";
import { StaffAvailability } from "@/types/models";
import { format } from "date-fns";

interface PartiallyAvailableStaffProps {
  availableStaff: StaffAvailability[];
  selectedStaffIds: string[];
  maxSelection: number;
  onSelectionChange: (staffIds: string[]) => void;
  excludeStaffIds?: string[];
  eventStartTime: string;
  eventEndTime: string;
  disabled?: boolean;
}

export default function PartiallyAvailableStaff({ 
  availableStaff, 
  selectedStaffIds, 
  maxSelection, 
  onSelectionChange, 
  excludeStaffIds = [],
  eventStartTime,
  eventEndTime,
  disabled = false 
}: PartiallyAvailableStaffProps) {
  const sortedStaff = useMemo(() => {
    return [...availableStaff].sort((a, b) => {
      // Sort by number of available time slots (more slots = higher priority)
      const aSlots = a.availableTimeSlots?.length || 0;
      const bSlots = b.availableTimeSlots?.length || 0;
      
      if (aSlots !== bSlots) {
        return bSlots - aSlots;
      }
      
      // If same number of slots, sort by total available duration
      const aTotalDuration = a.availableTimeSlots?.reduce((total, slot) => {
        const start = new Date(`2000-01-01T${slot.startTime}`);
        const end = new Date(`2000-01-01T${slot.endTime}`);
        return total + (end.getTime() - start.getTime());
      }, 0) || 0;
      
      const bTotalDuration = b.availableTimeSlots?.reduce((total, slot) => {
        const start = new Date(`2000-01-01T${slot.startTime}`);
        const end = new Date(`2000-01-01T${slot.endTime}`);
        return total + (end.getTime() - start.getTime());
      }, 0) || 0;
      
      if (aTotalDuration !== bTotalDuration) {
        return bTotalDuration - aTotalDuration;
      }
      
      // Finally sort by name
      return a.staff.name.localeCompare(b.staff.name);
    });
  }, [availableStaff]);

  const handleStaffToggle = (staffId: string) => {
    if (disabled) return;
    
    const isCurrentlySelected = selectedStaffIds.includes(staffId);
    
    if (isCurrentlySelected) {
      onSelectionChange(selectedStaffIds.filter(id => id !== staffId));
    } else if (selectedStaffIds.length < maxSelection) {
      onSelectionChange([...selectedStaffIds, staffId]);
    }
  };

  const formatTime = (time: string) => {
    try {
      return format(new Date(`2000-01-01T${time}`), 'h:mm a');
    } catch {
      return time;
    }
  };

  const formatDuration = (startTime: string, endTime: string) => {
    try {
      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);
      const durationMs = end.getTime() - start.getTime();
      const hours = Math.floor(durationMs / (1000 * 60 * 60));
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours === 0) return `${minutes}m`;
      if (minutes === 0) return `${hours}h`;
      return `${hours}h ${minutes}m`;
    } catch {
      return '';
    }
  };

  if (sortedStaff.length === 0) {
    return null;
  }

  return (
    <Accordion type="multiple" collapsible className="w-full space-y-2">
      {sortedStaff.map((availability) => {
        const staff = availability.staff;
        const isSelected = selectedStaffIds.includes(staff.id);
        const isExcluded = excludeStaffIds.includes(staff.id);
        const canSelect = !isExcluded && (isSelected || selectedStaffIds.length < maxSelection);
        const availableSlots = availability.availableTimeSlots?.map(slot => ({
          startTime: slot.startTime,
          endTime: slot.endTime
        })) || [];

        return (
          <AccordionItem key={staff.id} value={staff.id} className="border rounded-lg">
            <div className="flex items-center space-x-3 p-3">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => handleStaffToggle(staff.id)}
                disabled={disabled || !canSelect}
                className="flex-shrink-0"
              />
              
              <div className="flex-1 min-w-0">
                <AccordionTrigger className="flex-1 py-0 hover:no-underline">
                  <div className="flex items-center justify-between w-full mr-2">
                    <div className="flex items-center space-x-3 min-w-0">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={staff.photoUrl} alt={staff.name} />
                        <AvatarFallback className="text-xs">
                          {staff.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{staff.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            {availableSlots.length} slot{availableSlots.length !== 1 ? 's' : ''} available
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="ml-2 flex-shrink-0">
                      Partial
                    </Badge>
                  </div>
                </AccordionTrigger>
              </div>
            </div>
            
            <AccordionContent className="px-3 pb-3">
              <div className="space-y-3 mt-2">
                <div>
                  <h5 className="text-sm font-medium text-green-700 mb-2 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Available Time Slots
                  </h5>
                  <div className="space-y-2">
                    {availableSlots.map((slot, index) => (
                      <div key={index} className="flex items-center justify-between bg-green-50 p-2 rounded text-sm">
                        <span className="font-medium text-green-800">
                          {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                        </span>
                        <Badge variant="outline" className="text-xs text-green-700 border-green-300">
                          {formatDuration(slot.startTime, slot.endTime)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {availability.conflictingTimeSlots && availability.conflictingTimeSlots.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-red-700 mb-2 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Scheduling Conflicts
                    </h5>
                    <div className="space-y-2">
                      {availability.conflictingTimeSlots.map((conflict, index) => (
                        <div key={index} className="bg-red-50 p-2 rounded text-sm">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-red-800">
                              {formatTime(conflict.startTime)} - {formatTime(conflict.endTime)}
                            </span>
                            <Badge variant="outline" className="text-xs text-red-700 border-red-300">
                              {formatDuration(conflict.startTime, conflict.endTime)}
                            </Badge>
                          </div>
                          <p className="text-xs text-red-600">{conflict.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
