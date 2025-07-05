import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useEvents } from "@/hooks/events/use-events";
import { useStaff } from "@/hooks/use-staff";
import { EventType } from "@/types/models";
import { format } from "date-fns";
import { getEnhancedStaffAvailability } from "@/hooks/staff/enhanced-staff-availability";
import AddEventForm from "@/components/events/add-event-form";
import AddEventDateTime from "@/components/events/add-event-date-time";
import AddEventOptions from "@/components/events/add-event-options";
import AddEventStaffAssignment from "@/components/events/add-event-staff-assignment";

export default function AddEventPage() {
  const [name, setName] = useState("");
  const [logId, setLogId] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [type, setType] = useState<EventType>("General");
  const [staffAvailabilityMode, setStaffAvailabilityMode] = useState("normal");
  const [sendEmailNotifications, setSendEmailNotifications] = useState(true);
  const [selectedVideographers, setSelectedVideographers] = useState<string[]>([]);
  const [selectedPhotographers, setSelectedPhotographers] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [timeValidationError, setTimeValidationError] = useState("");
  const { addEvent } = useEvents();
  const { staff, loading: staffLoading } = useStaff();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Validate time function
  const validateTime = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) {
      setTimeValidationError("");
      return true;
    }
    
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    if (end <= start) {
      setTimeValidationError("End time must be later than start time");
      return false;
    }
    
    setTimeValidationError("");
    return true;
  };

  // Function to generate a unique log ID
  const generateLogId = () => {
    const prefix = "EVNT";
    const randomId = Math.random().toString(36).substring(2, 9).toUpperCase();
    const newLogId = `${prefix}-${randomId}`;
    setLogId(newLogId);
  };

  // Generate log ID on component mount
  useEffect(() => {
    generateLogId();
  }, []);

  // Auto-set end date when multi-day is enabled
  useEffect(() => {
    if (isMultiDay && date && !endDate) {
      setEndDate(date);
    }
  }, [isMultiDay, date, endDate]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!name || !logId || !date || !startTime || !endTime || !location) {
        toast({
          title: "Missing Fields",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }
      
      // Validate time
      if (!validateTime(startTime, endTime)) {
        setSubmitting(false);
        return;
      }

      const ignoreScheduleConflicts = staffAvailabilityMode === "ignore";
      const ccsOnlyEvent = staffAvailabilityMode === "ccs";

      // Format date properly to avoid timezone issues
      const formattedDate = format(date, 'yyyy-MM-dd');
      const formattedEndDate = isMultiDay && endDate ? format(endDate, 'yyyy-MM-dd') : undefined;

      // Save the event with multiple staff assignments
      const eventId = await addEvent(
        {
          name,
          logId,
          date: formattedDate,
          endDate: formattedEndDate,
          startTime,
          endTime,
          location,
          organizer: organizer || undefined,
          type,
          status: "Upcoming", // Default status for new events
          ignoreScheduleConflicts,
          ccsOnlyEvent,
          isBigEvent: false,
          bigEventId: null // Ensure this is null not empty string
        },
        selectedVideographers,
        selectedPhotographers,
        sendEmailNotifications
      );

      // If successful, show success message and navigate back
      if (eventId) {
        toast({
          title: "Event Created",
          description: "The event has been created successfully.",
        });
        navigate("/events");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Get enhanced staff availability for the event time
  const getStaffAvailabilityForEvent = () => {
    if (!date || !startTime || !endTime || timeValidationError) {
      return [];
    }

    const formattedDate = format(date, 'yyyy-MM-dd');
    const ignoreScheduleConflicts = staffAvailabilityMode === "ignore";
    const ccsOnlyEvent = staffAvailabilityMode === "ccs";
    
    return getEnhancedStaffAvailability(
      staff,
      formattedDate,
      startTime,
      endTime,
      ignoreScheduleConflicts,
      ccsOnlyEvent
    );
  };

  const staffAvailability = getStaffAvailabilityForEvent();
  const canSelectStaff = date && startTime && endTime && !timeValidationError;

  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h1 className="text-2xl font-bold tracking-tight">Add Event</h1>
            <Button onClick={() => navigate("/events")} variant="outline">
              Cancel
            </Button>
          </div>
          <Separator className="mb-6" />
          
          <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <AddEventForm
                    name={name}
                    setName={setName}
                    organizer={organizer}
                    setOrganizer={setOrganizer}
                    location={location}
                    setLocation={setLocation}
                    type={type}
                    setType={setType}
                  />
                  
                  <AddEventDateTime
                    date={date}
                    setDate={setDate}
                    endDate={endDate}
                    setEndDate={setEndDate}
                    isMultiDay={isMultiDay}
                    setIsMultiDay={setIsMultiDay}
                    startTime={startTime}
                    setStartTime={setStartTime}
                    endTime={endTime}
                    setEndTime={setEndTime}
                    timeValidationError={timeValidationError}
                    validateTime={validateTime}
                  />
                  
                  <AddEventOptions
                    staffAvailabilityMode={staffAvailabilityMode}
                    setStaffAvailabilityMode={setStaffAvailabilityMode}
                    sendEmailNotifications={sendEmailNotifications}
                    setSendEmailNotifications={setSendEmailNotifications}
                  />
                  
                  <AddEventStaffAssignment
                    canSelectStaff={canSelectStaff}
                    staffAvailabilityMode={staffAvailabilityMode}
                    staffAvailability={staffAvailability}
                    selectedVideographers={selectedVideographers}
                    setSelectedVideographers={setSelectedVideographers}
                    selectedPhotographers={selectedPhotographers}
                    setSelectedPhotographers={setSelectedPhotographers}
                    timeValidationError={timeValidationError}
                    eventStartTime={startTime}
                    eventEndTime={endTime}
                  />
                  
                  {/* Submit button - Sticky at bottom */}
                  <div className="sticky bottom-0 bg-background pt-4 border-t">
                    <Button type="submit" disabled={submitting || !!timeValidationError} className="w-full sm:w-auto">
                      {submitting ? "Creating Event..." : "Create Event"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
