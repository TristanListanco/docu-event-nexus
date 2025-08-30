import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Clock, CheckCircle } from "lucide-react";
import { StaffAvailability } from "@/types/models";
import { getEventGaps } from "./utils";

interface PartiallyAvailableStaffProps {
  partiallyAvailableStaff: StaffAvailability[];
  selectedStaffIds: string[];
  showPartiallyAvailable: boolean;
  setShowPartiallyAvailable: (show: boolean) => void;
  onSmartPick: (staffId: string) => void;
  disabled: boolean;
  canAddMore: boolean;
  eventStartTime?: string;
  eventEndTime?: string;
}

export default function PartiallyAvailableStaff({
  partiallyAvailableStaff,
  selectedStaffIds,
  showPartiallyAvailable,
  setShowPartiallyAvailable,
  onSmartPick,
  disabled,
  canAddMore,
  eventStartTime,
  eventEndTime
}: PartiallyAvailableStaffProps) {
  const hasPartiallyAvailable = partiallyAvailableStaff.length > 0;

  const getFormattedTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    return `${hours}:${minutes}`;
  };

  const calculateEventGaps = (availableSlots: { start: string; end: string }[]) => {
    if (!eventStartTime || !eventEndTime || availableSlots.length === 0) {
      return [];
    }

    // Convert available slots to the expected format
    const formattedSlots = availableSlots.map(slot => ({
      startTime: slot.start,
      endTime: slot.end
    }));

    return getEventGaps(eventStartTime, eventEndTime, formattedSlots);
  };

  return (
    <div>
      {hasPartiallyAvailable && (
        <div className="space-y-2">
          <Button
            variant="link"
            size="sm"
            onClick={() => setShowPartiallyAvailable(!showPartiallyAvailable)}
          >
            {showPartiallyAvailable ? "Hide Partially Available" : "Show Partially Available"}
          </Button>

          {showPartiallyAvailable && (
            <Accordion type="multiple" collapsible>
              {partiallyAvailableStaff.map((staff) => {
                const gaps = calculateEventGaps(staff.availableTimeSlots || []);
                const hasGaps = gaps.length > 0;
                const staffId = staff.staff.id;
                const isSelected = selectedStaffIds.includes(staffId);

                return (
                  <AccordionItem key={staff.staff.id} value={staff.staff.id}>
                    <AccordionTrigger className="font-medium">
                      {staff.staff.name} - Partially Available
                      {isSelected && <CheckCircle className="h-4 w-4 ml-2 text-green-500" />}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {staff.availableTimeSlots && staff.availableTimeSlots.length > 0 ? (
                          staff.availableTimeSlots.map((slot, index) => (
                            <div key={index} className="text-sm">
                              Available from {getFormattedTime(slot.start)} to {getFormattedTime(slot.end)}
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-muted-foreground">No specific availability provided.</div>
                        )}

                        {hasGaps && (
                          <div className="text-sm text-red-500">
                            Gaps in availability detected.
                          </div>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-center"
                          onClick={() => onSmartPick(staffId)}
                          disabled={disabled || !canAddMore || isSelected}
                        >
                          Smart Pick
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </div>
      )}
    </div>
  );
}
