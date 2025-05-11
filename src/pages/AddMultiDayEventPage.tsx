
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, addDays, differenceInDays } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useStaff } from "@/hooks/use-staff";
import { useEvents } from "@/hooks/use-events";
import { EventType, Event } from "@/types/models";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";

interface DayEvent {
  name: string;
  startTime: string;
  endTime: string;
  location: string;
  type: EventType;
  date: Date;
  videographers: string[];
  photographers: string[];
  ignoreScheduleConflicts: boolean;
}

export default function AddMultiDayEventPage() {
  const navigate = useNavigate();
  const { createEvent } = useEvents();
  const { staff, getAvailableStaff } = useStaff();
  
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [dayEvents, setDayEvents] = useState<DayEvent[]>([]);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [loading, setLoading] = useState(false);
  
  // Generate day tabs when date range is selected
  const generateDayTabs = () => {
    if (!startDate || !endDate) return [];
    
    const days = differenceInDays(endDate, startDate) + 1;
    const tabs = [];
    
    for (let i = 0; i < days; i++) {
      const day = addDays(startDate, i);
      tabs.push({
        id: `day-${i + 1}`,
        label: `Day ${i + 1}`,
        date: day,
      });
    }
    
    return tabs;
  };
  
  const dayTabs = generateDayTabs();
  
  // Initialize events for all days in the range
  const initializeDayEvents = () => {
    if (!startDate || !endDate) return;
    
    const days = differenceInDays(endDate, startDate) + 1;
    const initialEvents: DayEvent[] = [];
    
    for (let i = 0; i < days; i++) {
      const day = addDays(startDate, i);
      initialEvents.push({
        name: "",
        startTime: "",
        endTime: "",
        location: "",
        type: "General",
        date: day,
        videographers: [],
        photographers: [],
        ignoreScheduleConflicts: false,
      });
    }
    
    setDayEvents(initialEvents);
    if (days > 0) {
      setActiveTab(`day-1`);
    }
  };
  
  // When date range changes, initialize day events
  const handleDateRangeChange = (newStartDate: Date | undefined, newEndDate: Date | undefined) => {
    if (newStartDate && newEndDate) {
      setStartDate(newStartDate);
      setEndDate(newEndDate);
      
      // Initialize or update day events after both dates are selected
      if (dayEvents.length === 0) {
        // First time initialization
        const days = differenceInDays(newEndDate, newStartDate) + 1;
        const initialEvents: DayEvent[] = [];
        
        for (let i = 0; i < days; i++) {
          const day = addDays(newStartDate, i);
          initialEvents.push({
            name: "",
            startTime: "",
            endTime: "",
            location: "",
            type: "General",
            date: day,
            videographers: [],
            photographers: [],
            ignoreScheduleConflicts: false,
          });
        }
        
        setDayEvents(initialEvents);
        if (days > 0) {
          setActiveTab(`day-1`);
        }
      } else {
        // Update existing events when date range changes
        const currentCount = dayEvents.length;
        const newCount = differenceInDays(newEndDate, newStartDate) + 1;
        
        if (newCount > currentCount) {
          // Add more days
          const additionalEvents: DayEvent[] = [];
          for (let i = currentCount; i < newCount; i++) {
            const day = addDays(newStartDate, i);
            additionalEvents.push({
              name: "",
              startTime: "",
              endTime: "",
              location: "",
              type: "General",
              date: day,
              videographers: [],
              photographers: [],
              ignoreScheduleConflicts: false,
            });
          }
          
          // Also update dates for existing events
          const updatedEvents = [...dayEvents].map((event, i) => ({
            ...event,
            date: addDays(newStartDate, i)
          }));
          
          setDayEvents([...updatedEvents, ...additionalEvents]);
        } else if (newCount < currentCount) {
          // Remove excess days
          const trimmedEvents = dayEvents.slice(0, newCount).map((event, i) => ({
            ...event,
            date: addDays(newStartDate, i)
          }));
          
          setDayEvents(trimmedEvents);
          
          // Make sure active tab is still valid
          const activeTabIndex = parseInt(activeTab.replace('day-', ''));
          if (activeTabIndex > newCount) {
            setActiveTab('day-1');
          }
        } else {
          // Same number of days, just update the dates
          const updatedEvents = [...dayEvents].map((event, i) => ({
            ...event,
            date: addDays(newStartDate, i)
          }));
          setDayEvents(updatedEvents);
        }
      }
    }
  };
  
  // Update a specific day event
  const updateDayEvent = (index: number, field: keyof DayEvent, value: any) => {
    setDayEvents(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };
  
  // Handle staff selection for a specific day
  const handleStaffSelection = (index: number, staffId: string, type: 'videographers' | 'photographers') => {
    setDayEvents(prev => {
      const updated = [...prev];
      const currentStaff = [...updated[index][type]];
      
      if (currentStaff.includes(staffId)) {
        updated[index][type] = currentStaff.filter(id => id !== staffId);
      } else {
        updated[index][type] = [...currentStaff, staffId];
      }
      
      return updated;
    });
  };
  
  // Get available staff for a specific day
  const getAvailableStaffForDay = (index: number) => {
    const dayEvent = dayEvents[index];
    
    if (!dayEvent || !dayEvent.date || !dayEvent.startTime || !dayEvent.endTime) {
      return { videographers: [], photographers: [] };
    }
    
    const formattedDate = format(dayEvent.date, 'yyyy-MM-dd');
    
    if (dayEvent.ignoreScheduleConflicts) {
      // Return all staff if ignoring conflicts
      const videographers = staff.filter(s => s.role === 'Videographer');
      const photographers = staff.filter(s => s.role === 'Photographer');
      return { videographers, photographers };
    }
    
    return getAvailableStaff(formattedDate, dayEvent.startTime, dayEvent.endTime);
  };
  
  // Submit all events
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !startDate || !endDate) {
      toast({
        title: "Missing information",
        description: "Please provide a name and date range for the event",
        variant: "destructive",
      });
      return;
    }
    
    // Check if any day is missing essential information
    const incompleteDay = dayEvents.findIndex(day => 
      !day.name || !day.startTime || !day.endTime || !day.location
    );
    
    if (incompleteDay !== -1) {
      toast({
        title: "Incomplete day information",
        description: `Please complete the information for Day ${incompleteDay + 1}`,
        variant: "destructive",
      });
      setActiveTab(`day-${incompleteDay + 1}`);
      return;
    }
    
    setLoading(true);
    
    try {
      let bigEventId = "";
      
      // Create all events sequentially
      for (let i = 0; i < dayEvents.length; i++) {
        const dayEvent = dayEvents[i];
        
        const createdEvent = await createEvent({
          name: `${name} - ${dayEvent.name}`,
          date: format(dayEvent.date, 'yyyy-MM-dd'),
          startTime: dayEvent.startTime,
          endTime: dayEvent.endTime,
          location: dayEvent.location,
          type: dayEvent.type,
          status: "Upcoming" as const,
          videographers: dayEvent.videographers,
          photographers: dayEvent.photographers,
          ignoreScheduleConflicts: dayEvent.ignoreScheduleConflicts,
          isBigEvent: true,
          bigEventId: bigEventId || undefined
        });
        
        // Store the ID of the first event to link all events together
        if (i === 0 && createdEvent) {
          bigEventId = createdEvent.id;
        }
      }
      
      toast({
        title: "Multi-day event created",
        description: `Successfully created ${dayEvents.length} events for "${name}"`,
      });
      
      navigate("/events");
    } catch (error) {
      console.error("Error creating multi-day event:", error);
      toast({
        title: "Failed to create events",
        description: "An error occurred while creating the multi-day event",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Watch for date changes
  useEffect(() => {
    if (startDate && endDate) {
      handleDateRangeChange(startDate, endDate);
    }
  }, [startDate, endDate]);
  
  return (
    <div className="container py-6">
      <div className="mb-6 flex items-center">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/events")}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Add Multi-Day Event</h1>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Multi-Day Event Overview</CardTitle>
            <CardDescription>Provide general information about this multi-day event</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Event Series Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Enter event series name"
              />
            </div>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : <span>Pick a start date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => {
                        setStartDate(date);
                        if (date && (!endDate || date > endDate)) {
                          setEndDate(date);
                        }
                      }}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                      disabled={!startDate}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : <span>Pick an end date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    {startDate && (
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        disabled={(date) => date < startDate!}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    )}
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {startDate && endDate && dayEvents.length > 0 && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4 flex-wrap">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              {dayTabs.map((tab, index) => (
                <TabsTrigger key={tab.id} value={tab.id}>
                  Day {index + 1} ({format(tab.date, "MMM d")})
                </TabsTrigger>
              ))}
            </TabsList>
            
            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle>Event Summary</CardTitle>
                  <CardDescription>Review all events before submitting</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dayEvents.map((dayEvent, index) => (
                      <div key={index} className="p-4 border rounded-md">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">
                              Day {index + 1} - {format(dayEvent.date, "MMMM d, yyyy")}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {dayEvent.name || "No name provided"}
                            </p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setActiveTab(`day-${index + 1}`)}
                          >
                            Edit
                          </Button>
                        </div>
                        
                        {dayEvent.name ? (
                          <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Time:</span>{" "}
                              {dayEvent.startTime} - {dayEvent.endTime}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Location:</span>{" "}
                              {dayEvent.location}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Type:</span>{" "}
                              {dayEvent.type}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Staff:</span>{" "}
                              {dayEvent.videographers.length + dayEvent.photographers.length} assigned
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-red-500 mt-2">
                            Information not complete. Click Edit to provide details.
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {dayTabs.map((tab, index) => (
              <TabsContent key={tab.id} value={tab.id}>
                <Card>
                  <CardHeader>
                    <CardTitle>Day {index + 1} - {format(tab.date, "MMMM d, yyyy")}</CardTitle>
                    <CardDescription>Provide details for this specific day</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`day-${index}-name`}>Event Name</Label>
                        <Input
                          id={`day-${index}-name`}
                          value={dayEvents[index]?.name || ""}
                          onChange={(e) => updateDayEvent(index, "name", e.target.value)}
                          placeholder="Enter event name for this day"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`day-${index}-type`}>Event Type</Label>
                        <Select 
                          value={dayEvents[index]?.type || "General"} 
                          onValueChange={(val) => updateDayEvent(index, "type", val as EventType)}
                        >
                          <SelectTrigger id={`day-${index}-type`}>
                            <SelectValue placeholder="Select event type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="General">General Event</SelectItem>
                            <SelectItem value="SPECOM">SPECOM</SelectItem>
                            <SelectItem value="LITCOM">LITCOM</SelectItem>
                            <SelectItem value="CUACOM">CUACOM</SelectItem>
                            <SelectItem value="SPODACOM">SPODACOM</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center space-x-2 sm:col-span-2">
                        <Checkbox 
                          id={`day-${index}-ignore-conflicts`}
                          checked={dayEvents[index]?.ignoreScheduleConflicts || false}
                          onCheckedChange={(checked) => 
                            updateDayEvent(index, "ignoreScheduleConflicts", checked === true)
                          }
                        />
                        <Label htmlFor={`day-${index}-ignore-conflicts`}>
                          Ignore schedule conflicts
                        </Label>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`day-${index}-start-time`}>Start Time</Label>
                        <Input
                          id={`day-${index}-start-time`}
                          type="time"
                          value={dayEvents[index]?.startTime || ""}
                          onChange={(e) => updateDayEvent(index, "startTime", e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`day-${index}-end-time`}>End Time</Label>
                        <Input
                          id={`day-${index}-end-time`}
                          type="time"
                          value={dayEvents[index]?.endTime || ""}
                          onChange={(e) => updateDayEvent(index, "endTime", e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor={`day-${index}-location`}>Location</Label>
                        <Input
                          id={`day-${index}-location`}
                          value={dayEvents[index]?.location || ""}
                          onChange={(e) => updateDayEvent(index, "location", e.target.value)}
                          placeholder="Enter location"
                        />
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <h3 className="text-lg font-medium mb-4">Staff Assignment</h3>
                      
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Videographers</h4>
                          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {getAvailableStaffForDay(index).videographers.length > 0 ? (
                              getAvailableStaffForDay(index).videographers.map((videographer) => (
                                <div key={videographer.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`video-${index}-${videographer.id}`}
                                    checked={dayEvents[index]?.videographers.includes(videographer.id) || false}
                                    onCheckedChange={() => handleStaffSelection(index, videographer.id, 'videographers')}
                                  />
                                  <Label htmlFor={`video-${index}-${videographer.id}`} className="flex items-center">
                                    <span className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">
                                      {videographer.name.split(" ").map((n) => n[0]).join("")}
                                    </span>
                                    {videographer.name}
                                  </Label>
                                </div>
                              ))
                            ) : (
                              <p className="text-muted-foreground italic col-span-3">
                                {dayEvents[index]?.startTime && dayEvents[index]?.endTime
                                  ? "No videographers available for this time slot"
                                  : "Select time to see available videographers"}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Photographers</h4>
                          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {getAvailableStaffForDay(index).photographers.length > 0 ? (
                              getAvailableStaffForDay(index).photographers.map((photographer) => (
                                <div key={photographer.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`photo-${index}-${photographer.id}`}
                                    checked={dayEvents[index]?.photographers.includes(photographer.id) || false}
                                    onCheckedChange={() => handleStaffSelection(index, photographer.id, 'photographers')}
                                  />
                                  <Label htmlFor={`photo-${index}-${photographer.id}`} className="flex items-center">
                                    <span className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">
                                      {photographer.name.split(" ").map((n) => n[0]).join("")}
                                    </span>
                                    {photographer.name}
                                  </Label>
                                </div>
                              ))
                            ) : (
                              <p className="text-muted-foreground italic col-span-3">
                                {dayEvents[index]?.startTime && dayEvents[index]?.endTime
                                  ? "No photographers available for this time slot"
                                  : "Select time to see available photographers"}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        )}
        
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/events")}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !startDate || !endDate}>
            {loading ? "Creating..." : "Create Multi-Day Event"}
          </Button>
        </div>
      </form>
    </div>
  );
}
