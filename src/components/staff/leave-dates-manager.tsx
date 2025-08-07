
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, X, Plus } from "lucide-react";
import { format, isAfter, isBefore } from "date-fns";
import { cn } from "@/lib/utils";
import { LeaveDate } from "@/types/models";

interface LeaveDatesManagerProps {
  leaveDates: LeaveDate[];
  onLeaveDatesChange: (leaveDates: LeaveDate[]) => void;
}

export default function LeaveDatesManager({ leaveDates, onLeaveDatesChange }: LeaveDatesManagerProps) {
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [startCalendarOpen, setStartCalendarOpen] = useState(false);
  const [endCalendarOpen, setEndCalendarOpen] = useState(false);

  // Filter out expired leave dates (where end date has passed)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const currentLeaveDates = leaveDates.filter(leave => {
    const endDate = new Date(leave.endDate);
    return !isBefore(endDate, today);
  });

  const addLeaveDate = () => {
    if (!startDate || !endDate) return;
    
    // Ensure start date is before or equal to end date
    let finalStartDate = startDate;
    let finalEndDate = endDate;
    
    if (isAfter(startDate, endDate)) {
      finalStartDate = endDate;
      finalEndDate = startDate;
    }

    const newLeaveDate: LeaveDate = {
      id: `temp-${Date.now()}`, // Temporary ID for new entries
      startDate: format(finalStartDate, "yyyy-MM-dd"),
      endDate: format(finalEndDate, "yyyy-MM-dd")
    };

    onLeaveDatesChange([...leaveDates, newLeaveDate]);
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const removeLeaveDate = (id: string) => {
    onLeaveDatesChange(leaveDates.filter(leave => leave.id !== id));
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return isBefore(date, today);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-3">
        <div className="flex space-x-2">
          <div className="flex-1">
            <Popover open={startCalendarOpen} onOpenChange={setStartCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "MMM dd, yyyy") : "Start Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => {
                    setStartDate(date);
                    setStartCalendarOpen(false);
                  }}
                  disabled={isDateDisabled}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="flex-1">
            <Popover open={endCalendarOpen} onOpenChange={setEndCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "MMM dd, yyyy") : "End Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => {
                    setEndDate(date);
                    setEndCalendarOpen(false);
                  }}
                  disabled={isDateDisabled}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={addLeaveDate}
            disabled={!startDate || !endDate}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {currentLeaveDates.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Leave Dates</p>
          <div className="flex flex-wrap gap-2">
            {currentLeaveDates.map((leave) => (
              <Badge key={leave.id} variant="secondary" className="bg-orange-100 text-orange-800 hover:bg-orange-200">
                <span className="mr-2">
                  {format(new Date(leave.startDate), "MMM dd")} - {format(new Date(leave.endDate), "MMM dd, yyyy")}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 hover:bg-transparent"
                  onClick={() => removeLeaveDate(leave.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
