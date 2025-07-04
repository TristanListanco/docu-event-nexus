
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Clock, AlertCircle } from "lucide-react";

interface AddEventDateTimeProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  endDate: Date | undefined;
  setEndDate: (date: Date | undefined) => void;
  isMultiDay: boolean;
  setIsMultiDay: (value: boolean) => void;
  startTime: string;
  setStartTime: (value: string) => void;
  endTime: string;
  setEndTime: (value: string) => void;
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
  return (
    <div className="space-y-6">
      {/* Multi-day toggle */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="multiDay"
          checked={isMultiDay}
          onCheckedChange={(checked) => setIsMultiDay(!!checked)}
        />
        <Label htmlFor="multiDay">Multi-day event</Label>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick start date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center" side="bottom">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={(date) =>
                  date < new Date(new Date().setHours(0, 0, 0, 0))
                }
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
        
        {isMultiDay && (
          <div className="space-y-2">
            <Label>End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : <span>Pick end date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center" side="bottom">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  disabled={(date) =>
                    date < (date || new Date()) || date < new Date(new Date().setHours(0, 0, 0, 0))
                  }
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label htmlFor="startTime">Start Time</Label>
          <div className="relative">
            <Clock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="startTime"
              type="time"
              value={startTime}
              onChange={(e) => {
                setStartTime(e.target.value);
                validateTime(e.target.value, endTime);
              }}
              className={cn("pl-8", timeValidationError && "border-red-500")}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="endTime">End Time</Label>
          <div className="relative">
            <Clock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="endTime"
              type="time"
              value={endTime}
              onChange={(e) => {
                setEndTime(e.target.value);
                validateTime(startTime, e.target.value);
              }}
              className={cn("pl-8", timeValidationError && "border-red-500")}
              required
            />
          </div>
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
