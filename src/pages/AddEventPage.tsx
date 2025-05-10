
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CalendarDays, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEvents } from "@/hooks/use-events";
import { useStaff } from "@/hooks/use-staff";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { EventType } from "@/types/models";

// Define the form schema for validation
const eventFormSchema = z.object({
  name: z.string().min(3, { message: "Event name must be at least 3 characters" }),
  date: z.date({ required_error: "Event date is required" }),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Start time must be in HH:MM format" }),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "End time must be in HH:MM format" }),
  location: z.string().min(2, { message: "Location is required" }),
  type: z.enum(["SPECOM", "LITCOM", "CUACOM", "SPODACOM", "General"]),
  ignoreScheduleConflicts: z.boolean().default(false),
  videographers: z.array(z.string()).default([]),
  photographers: z.array(z.string()).default([])
});

type EventFormValues = z.infer<typeof eventFormSchema>;

export default function AddEventPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createEvent } = useEvents();
  const { staff, getAvailableStaff } = useStaff();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("12:00");
  const [ignoreConflicts, setIgnoreConflicts] = useState(false);
  
  // Initialize form with default values
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      name: "",
      date: new Date(),
      startTime: "09:00",
      endTime: "12:00",
      location: "",
      type: "General" as EventType,
      ignoreScheduleConflicts: false,
      videographers: [],
      photographers: []
    }
  });
  
  const { formState } = form;
  
  // Get available staff based on current form values
  const availableStaff = selectedDate 
    ? getAvailableStaff(
        format(selectedDate, 'yyyy-MM-dd'),
        startTime,
        endTime
      )
    : { videographers: [], photographers: [] };
    
  // Filter staff based on conflicts and selected values
  const getStaffOptions = (role: 'Videographer' | 'Photographer') => {
    const roleStaff = staff.filter(s => s.role === role);
    const availableStaffIds = (role === 'Videographer' 
      ? availableStaff.videographers 
      : availableStaff.photographers).map(s => s.id);
      
    return roleStaff.map(s => ({
      id: s.id,
      name: s.name,
      available: ignoreConflicts ? true : availableStaffIds.includes(s.id)
    }));
  };
  
  // Handle form submission
  const onSubmit = async (data: EventFormValues) => {
    try {
      const formattedDate = format(data.date, 'yyyy-MM-dd');
      
      const result = await createEvent({
        name: data.name,
        date: formattedDate,
        startTime: data.startTime,
        endTime: data.endTime,
        location: data.location,
        type: data.type,
        ignoreScheduleConflicts: data.ignoreScheduleConflicts,
        status: "Upcoming",
        videographers: data.videographers,
        photographers: data.photographers
      });
      
      if (result) {
        navigate('/events');
      }
    } catch (error) {
      console.error("Error creating event:", error);
      toast({
        title: "Error",
        description: "Failed to create the event. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="border-b">
        <div className="flex items-center p-4">
          <Button variant="ghost" onClick={() => navigate('/events')} className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Add New Event</h1>
            <p className="text-muted-foreground">Create a new event and assign staff</p>
          </div>
        </div>
      </div>
      
      <div className="p-4 md:p-6 flex-1 overflow-y-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Event Details</CardTitle>
                  <CardDescription>Enter the basic information about this event</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter event name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter location" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Type</FormLabel>
                        <Select 
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
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
                                  <span>Pick a date</span>
                                )}
                                <CalendarDays className="ml-auto h-4 w-4" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={(date) => {
                                field.onChange(date);
                                setSelectedDate(date);
                              }}
                              initialFocus
                              className={cn("p-3 pointer-events-auto")}
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
                            <div className="flex">
                              <Input 
                                type="time" 
                                {...field} 
                                onChange={(e) => {
                                  field.onChange(e);
                                  setStartTime(e.target.value);
                                }}
                              />
                              <Clock className="ml-2 h-4 w-4 mt-3" />
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
                            <div className="flex">
                              <Input 
                                type="time" 
                                {...field} 
                                onChange={(e) => {
                                  field.onChange(e);
                                  setEndTime(e.target.value);
                                }}
                              />
                              <Clock className="ml-2 h-4 w-4 mt-3" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Staff Assignment</CardTitle>
                  <CardDescription>Assign staff members to this event</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="ignoreScheduleConflicts"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <input
                            type="checkbox"
                            className="h-4 w-4 mt-1"
                            checked={field.value}
                            onChange={(e) => {
                              field.onChange(e.target.checked);
                              setIgnoreConflicts(e.target.checked);
                            }}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Ignore Schedule Conflicts</FormLabel>
                          <FormDescription>
                            Allow assigning staff with schedule conflicts
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="videographers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Videographers</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            {getStaffOptions('Videographer').length > 0 ? (
                              getStaffOptions('Videographer').map(videographer => (
                                <div
                                  key={videographer.id}
                                  className={cn(
                                    "flex items-center space-x-2 rounded-md border p-2",
                                    !videographer.available && !ignoreConflicts && "bg-muted opacity-60"
                                  )}
                                >
                                  <input
                                    type="checkbox"
                                    disabled={!videographer.available && !ignoreConflicts}
                                    id={`videographer-${videographer.id}`}
                                    value={videographer.id}
                                    checked={field.value.includes(videographer.id)}
                                    onChange={(e) => {
                                      const updatedValues = e.target.checked
                                        ? [...field.value, videographer.id]
                                        : field.value.filter(id => id !== videographer.id);
                                      field.onChange(updatedValues);
                                    }}
                                    className="h-4 w-4"
                                  />
                                  <Label
                                    htmlFor={`videographer-${videographer.id}`}
                                    className={cn(
                                      "text-sm",
                                      !videographer.available && !ignoreConflicts && "text-muted-foreground"
                                    )}
                                  >
                                    {videographer.name}
                                    {!videographer.available && !ignoreConflicts && " (Has schedule conflict)"}
                                  </Label>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-muted-foreground">No videographers available</p>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="photographers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Photographers</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            {getStaffOptions('Photographer').length > 0 ? (
                              getStaffOptions('Photographer').map(photographer => (
                                <div
                                  key={photographer.id}
                                  className={cn(
                                    "flex items-center space-x-2 rounded-md border p-2",
                                    !photographer.available && !ignoreConflicts && "bg-muted opacity-60"
                                  )}
                                >
                                  <input
                                    type="checkbox"
                                    disabled={!photographer.available && !ignoreConflicts}
                                    id={`photographer-${photographer.id}`}
                                    value={photographer.id}
                                    checked={field.value.includes(photographer.id)}
                                    onChange={(e) => {
                                      const updatedValues = e.target.checked
                                        ? [...field.value, photographer.id]
                                        : field.value.filter(id => id !== photographer.id);
                                      field.onChange(updatedValues);
                                    }}
                                    className="h-4 w-4"
                                  />
                                  <Label
                                    htmlFor={`photographer-${photographer.id}`}
                                    className={cn(
                                      "text-sm",
                                      !photographer.available && !ignoreConflicts && "text-muted-foreground"
                                    )}
                                  >
                                    {photographer.name}
                                    {!photographer.available && !ignoreConflicts && " (Has schedule conflict)"}
                                  </Label>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-muted-foreground">No photographers available</p>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button type="submit" disabled={formState.isSubmitting}>
                    {formState.isSubmitting ? "Creating..." : "Create Event"}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
