
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Clock, CheckCircle } from "lucide-react";
import { StaffAvailability } from "@/types/models";

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
            <Accordion type="multiple">
              {partiallyAvailableStaff.map((staff) => {
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
                              Available from {getFormattedTime(slot.startTime)} to {getFormattedTime(slot.endTime)}
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-muted-foreground">No specific availability provided.</div>
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
