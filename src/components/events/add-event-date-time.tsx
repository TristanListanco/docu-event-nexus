
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface AddEventDateTimeProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  endDate: Date | undefined;
  setEndDate: (date: Date | undefined) => void;
  isMultiDay: boolean;
  setIsMultiDay: (isMultiDay: boolean) => void;
  startTime: string;
  setStartTime: (time: string) => void;
  endTime: string;
  setEndTime: (time: string) => void;
  timeValidationError: string;
  validateTime: (startTime: string, endTime: string) => boolean;
}

export default function AddEventDateTime({
  date,
  setDate,
  endDate,
  setEndDate,
  isMultiDay,
  setIsMultiDay,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  timeValidationError,
  validateTime
}: AddEventDateTimeProps) {
  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartTime = e.target.value;
    setStartTime(newStartTime);
    validateTime(newStartTime, endTime);
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndTime = e.target.value;
    setEndTime(newEndTime);
    validateTime(startTime, newEndTime);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Date & Time</h3>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="multiDay"
          checked={isMultiDay}
          onCheckedChange={(checked) => setIsMultiDay(!!checked)}
        />
        <Label htmlFor="multiDay">Multi-day event</Label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
                id="date"
              >
                {date ? format(date, "MMMM dd, yyyy") : (
                  <span>Pick a date</span>
                )}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        
        {isMultiDay && (
          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                  id="endDate"
                >
                  {endDate ? format(endDate, "MMMM dd, yyyy") : (
                    <span>Pick end date</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  disabled={(date) => !date || date < (date || new Date())}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startTime">Start Time</Label>
          <Input
            type="time"
            id="startTime"
            value={startTime}
            onChange={handleStartTimeChange}
            required
            className={cn(timeValidationError && "border-red-500")}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="endTime">End Time</Label>
          <Input
            type="time"
            id="endTime"
            value={endTime}
            onChange={handleEndTimeChange}
            required
            className={cn(timeValidationError && "border-red-500")}
          />
        </div>
      </div>

      {timeValidationError && (
        <div className="text-sm text-red-500 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {timeValidationError}
        </div>
      )}
    </div>
  );
}
