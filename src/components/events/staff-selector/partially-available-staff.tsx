
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ChevronDown, Clock, AlertCircle, Zap, Users } from "lucide-react";
import { StaffAvailability } from "@/types/models";
import { cn } from "@/lib/utils";

interface PartiallyAvailableStaffProps {
  availableStaff: StaffAvailability[];
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
  availableStaff,
  selectedStaffIds,
  showPartiallyAvailable,
  setShowPartiallyAvailable,
  onSmartPick,
  disabled,
  canAddMore,
  eventStartTime,
  eventEndTime
}: PartiallyAvailableStaffProps) {
  
  const formatTimeSlot = (slot: { start: string; end: string }) => {
    return `${slot.start} - ${slot.end}`;
  };

  const calculateCoveragePercentage = (availableSlots: { start: string; end: string }[], eventStart?: string, eventEnd?: string) => {
    if (!eventStart || !eventEnd || !availableSlots.length) return 0;
    
    const eventStartMinutes = timeToMinutes(eventStart);
    const eventEndMinutes = timeToMinutes(eventEnd);
    const eventDuration = eventEndMinutes - eventStartMinutes;
    
    let coveredMinutes = 0;
    
    availableSlots.forEach(slot => {
      const slotStart = Math.max(timeToMinutes(slot.start), eventStartMinutes);
      const slotEnd = Math.min(timeToMinutes(slot.end), eventEndMinutes);
      if (slotEnd > slotStart) {
        coveredMinutes += slotEnd - slotStart;
      }
    });
    
    return Math.round((coveredMinutes / eventDuration) * 100);
  };

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const identifyGaps = (availableSlots: { start: string; end: string }[], eventStart?: string, eventEnd?: string) => {
    if (!eventStart || !eventEnd || !availableSlots.length) return [];
    
    const eventStartMinutes = timeToMinutes(eventStart);
    const eventEndMinutes = timeToMinutes(eventEnd);
    
    // Sort slots by start time
    const sortedSlots = [...availableSlots]
      .map(slot => ({
        start: Math.max(timeToMinutes(slot.start), eventStartMinutes),
        end: Math.min(timeToMinutes(slot.end), eventEndMinutes)
      }))
      .filter(slot => slot.end > slot.start)
      .sort((a, b) => a.start - b.start);
    
    const gaps: { start: string; end: string }[] = [];
    let currentPosition = eventStartMinutes;
    
    sortedSlots.forEach(slot => {
      if (slot.start > currentPosition) {
        gaps.push({
          start: minutesToTime(currentPosition),
          end: minutesToTime(slot.start)
        });
      }
      currentPosition = Math.max(currentPosition, slot.end);
    });
    
    // Check for gap at the end
    if (currentPosition < eventEndMinutes) {
      gaps.push({
        start: minutesToTime(currentPosition),
        end: minutesToTime(eventEndMinutes)
      });
    }
    
    return gaps;
  };

  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  if (availableStaff.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full flex items-center justify-between"
        onClick={() => setShowPartiallyAvailable(!showPartiallyAvailable)}
      >
        <span className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Partially Available Staff ({availableStaff.length})
        </span>
        <ChevronDown 
          className={cn("h-4 w-4 transition-transform", showPartiallyAvailable && "rotate-180")} 
        />
      </Button>

      {showPartiallyAvailable && (
        <Accordion type="multiple" className="space-y-2">
          {availableStaff.map((staffMember, index) => {
            const isSelected = selectedStaffIds.includes(staffMember.staff.id);
            const coverage = calculateCoveragePercentage(
              staffMember.availableTimeSlots || [], 
              eventStartTime, 
              eventEndTime
            );
            const gaps = identifyGaps(
              staffMember.availableTimeSlots || [], 
              eventStartTime, 
              eventEndTime
            );

            return (
              <AccordionItem key={staffMember.staff.id} value={`staff-${index}`}>
                <Card className={cn(
                  "transition-all duration-200",
                  isSelected && "ring-2 ring-primary"
                )}>
                  <AccordionTrigger className="hover:no-underline p-0">
                    <CardContent className="p-3 flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">{staffMember.staff.name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{coverage}% coverage</span>
                            {gaps.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {gaps.length} gap{gaps.length > 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {!isSelected && canAddMore && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSmartPick(staffMember.staff.id);
                          }}
                          disabled={disabled}
                        >
                          <Zap className="h-3 w-3" />
                          Add
                        </Button>
                      )}
                      
                      {isSelected && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Selected
                        </Badge>
                      )}
                    </CardContent>
                  </AccordionTrigger>
                  
                  <AccordionContent>
                    <div className="px-3 pb-3 space-y-2">
                      <div className="text-sm">
                        <p className="font-medium mb-1">Available Time Slots:</p>
                        <div className="grid gap-1">
                          {staffMember.availableTimeSlots?.map((slot, slotIndex) => (
                            <Badge key={slotIndex} variant="outline" className="justify-start text-xs">
                              {formatTimeSlot(slot)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      {gaps.length > 0 && (
                        <div className="text-sm">
                          <p className="font-medium mb-1 flex items-center gap-1 text-amber-600">
                            <AlertCircle className="h-3 w-3" />
                            Coverage Gaps:
                          </p>
                          <div className="grid gap-1">
                            {gaps.map((gap, gapIndex) => (
                              <Badge key={gapIndex} variant="destructive" className="justify-start text-xs">
                                {formatTimeSlot({ 
                                  start: gap.start, 
                                  end: gap.end 
                                })}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}
