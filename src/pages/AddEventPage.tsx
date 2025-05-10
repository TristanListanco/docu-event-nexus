
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, Clock, Users } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EventType, StaffMember } from "@/types/models";
import { useEvents } from "@/hooks/use-events";
import { useStaff } from "@/hooks/use-staff";

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Event title must be at least 2 characters.",
  }),
  date: z.date({
    required_error: "A date is required.",
  }),
  startTime: z.string().min(1, {
    message: "Start time is required.",
  }),
  endTime: z.string().min(1, {
    message: "End time is required.",
  }),
  location: z.string().min(2, {
    message: "Location must be at least 2 characters.",
  }),
  eventType: z.string().min(1, {
    message: "Please select an event type.",
  }),
  videographers: z.array(z.string()).optional(),
  photographers: z.array(z.string()).optional(),
}).refine((data) => {
  return data.startTime < data.endTime;
}, {
  message: "End time must be after start time.",
  path: ["endTime"]
});

export default function AddEventPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { createEvent } = useEvents();
  const { staff, loading: staffLoading, getAvailableStaff } = useStaff();
  const [availableVideographers, setAvailableVideographers] = useState<StaffMember[]>([]);
  const [availablePhotographers, setAvailablePhotographers] = useState<StaffMember[]>([]);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      location: "",
      startTime: "09:00",
      endTime: "11:00",
      eventType: "",
      videographers: [],
      photographers: []
    },
  });

  // Watch for changes to date, start time and end time to update available staff
  const watchDate = form.watch("date");
  const watchStartTime = form.watch("startTime");
  const watchEndTime = form.watch("endTime");

  // Update available staff whenever date or time changes
  useEffect(() => {
    const checkAvailableStaff = async () => {
      if (!watchDate || !watchStartTime || !watchEndTime) return;
      
      setIsCheckingAvailability(true);
      
      const formattedDate = format(watchDate, 'yyyy-MM-dd');
      
      // Check available videographers
      const videographers = await getAvailableStaff(
        formattedDate,
        watchStartTime,
        watchEndTime,
        "Videographer"
      );
      
      // Check available photographers
      const photographers = await getAvailableStaff(
        formattedDate,
        watchStartTime,
        watchEndTime,
        "Photographer"
      );
      
      setAvailableVideographers(videographers);
      setAvailablePhotographers(photographers);
      setIsCheckingAvailability(false);
    };
    
    if (watchDate && watchStartTime && watchEndTime) {
      checkAvailableStaff();
    }
  }, [watchDate, watchStartTime, watchEndTime]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      const result = await createEvent({
        name: values.title,
        date: format(values.date, 'yyyy-MM-dd'),
        startTime: values.startTime,
        endTime: values.endTime,
        location: values.location,
        type: values.eventType as EventType,
        status: 'Upcoming',
        ignoreScheduleConflicts: false,
        isBigEvent: false
      });
      
      if (result) {
        navigate("/events");
      }
    } catch (error) {
      console.error("Error creating event:", error);
      toast({
        title: "Error",
        description: "There was a problem creating the event.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Add New Event</h1>
            <p className="text-muted-foreground">Create a new event for your schedule</p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate("/events")}
          >
            Cancel
          </Button>
        </div>
      </div>
      
      <div className="p-4 flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter event title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Event Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Select a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <div className="flex items-center">
                            <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                            <Input type="time" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time</FormLabel>
                        <FormControl>
                          <div className="flex items-center">
                            <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                            <Input type="time" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter event location" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="eventType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select event type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="SPECOM">SPECOM</SelectItem>
                          <SelectItem value="LITCOM">LITCOM</SelectItem>
                          <SelectItem value="CUACOM">CUACOM</SelectItem>
                          <SelectItem value="SPODACOM">SPODACOM</SelectItem>
                          <SelectItem value="General">General</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Videographers */}
                <FormField
                  control={form.control}
                  name="videographers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Videographers</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange([value])}
                        value={field.value?.[0]}
                        disabled={isCheckingAvailability || !watchDate}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a videographer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isCheckingAvailability ? (
                            <div className="p-2 text-center">
                              <Clock className="animate-spin h-4 w-4 mx-auto mb-2" />
                              <p>Checking availability...</p>
                            </div>
                          ) : availableVideographers.length > 0 ? (
                            availableVideographers.map((videographer) => (
                              <SelectItem key={videographer.id} value={videographer.id}>
                                {videographer.name}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-2 text-center text-muted-foreground">
                              <Users className="h-4 w-4 mx-auto mb-2" />
                              <p>No available videographers for this time</p>
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {!watchDate ? "Select a date and time first" : "Available videographers for the selected time"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Photographers */}
                <FormField
                  control={form.control}
                  name="photographers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Photographers</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange([value])}
                        value={field.value?.[0]}
                        disabled={isCheckingAvailability || !watchDate}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a photographer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isCheckingAvailability ? (
                            <div className="p-2 text-center">
                              <Clock className="animate-spin h-4 w-4 mx-auto mb-2" />
                              <p>Checking availability...</p>
                            </div>
                          ) : availablePhotographers.length > 0 ? (
                            availablePhotographers.map((photographer) => (
                              <SelectItem key={photographer.id} value={photographer.id}>
                                {photographer.name}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-2 text-center text-muted-foreground">
                              <Users className="h-4 w-4 mx-auto mb-2" />
                              <p>No available photographers for this time</p>
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {!watchDate ? "Select a date and time first" : "Available photographers for the selected time"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating..." : "Create Event"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
