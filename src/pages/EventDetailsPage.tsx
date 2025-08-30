import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Calendar as CalendarIcon, CheckCircle, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { Event, StaffAssignmentData, AttendanceStatus, ConfirmationStatus } from "@/types/models";
import { supabase } from "@/integrations/supabase/client";
import { StaffAttendance } from "@/components/events/event-attendance";
import StaffAvailabilityTimeline from "@/components/events/staff-availability-timeline";

export default function EventDetailsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [event, setEvent] = useState<Event | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [editedDate, setEditedDate] = useState<Date | undefined>(undefined);
  const [editedStartTime, setEditedStartTime] = useState("");
  const [editedEndTime, setEditedEndTime] = useState("");
  const [assignedVideographers, setAssignedVideographers] = useState<StaffAssignmentData[]>([]);
  const [assignedPhotographers, setAssignedPhotographers] = useState<StaffAssignmentData[]>([]);

  const { isLoading, error } = useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      if (!eventId) {
        throw new Error("Event ID is required");
      }

      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (eventError) {
        console.error("Error fetching event:", eventError);
        throw eventError;
      }

      if (!eventData) {
        throw new Error("Event not found");
      }

      // Map database fields to Event interface - handle description properly
      const mappedEvent: Event = {
        id: eventData.id,
        logId: eventData.log_id || eventData.id,
        name: eventData.name,
        description: (eventData as any).description || "", // Cast to any to access description
        date: eventData.date,
        endDate: eventData.end_date,
        startTime: eventData.start_time,
        endTime: eventData.end_time,
        location: eventData.location || "",
        organizer: eventData.organizer,
        type: eventData.type,
        status: eventData.status,
        ignoreScheduleConflicts: eventData.ignore_schedule_conflicts,
        ccsOnlyEvent: eventData.ccs_only_event,
        isBigEvent: eventData.is_big_event,
        bigEventId: eventData.big_event_id,
      };

      setEvent(mappedEvent);
      setEditedName(mappedEvent.name);
      setEditedDescription(mappedEvent.description || "");
      setEditedDate(new Date(mappedEvent.date));
      setEditedStartTime(mappedEvent.startTime);
      setEditedEndTime(mappedEvent.endTime);

      return mappedEvent;
    },
  });

  useEffect(() => {
    const fetchStaffAssignments = async () => {
      if (!eventId) return;

      const { data, error } = await supabase
        .from('staff_assignments')
        .select(`
          staff_id, 
          attendance_status,
          confirmation_status,
          confirmation_token,
          confirmed_at,
          declined_at,
          staff_members!inner(id, name, role)
        `)
        .eq('event_id', eventId);

      if (error) {
        console.error("Error fetching staff assignments:", error);
        toast({
          title: "Error",
          description: "Failed to load staff assignments.",
          variant: "destructive",
        });
        return;
      }

      // Filter and set videographers and photographers based on database structure
      const videographers = data?.filter(assignment => {
        return assignment.staff_members && assignment.staff_members.role === 'Videographer';
      }).map(assignment => ({
        ...assignment,
        confirmation_status: (assignment.confirmation_status || 'pending') as ConfirmationStatus
      })) || [];

      const photographers = data?.filter(assignment => {
        return assignment.staff_members && assignment.staff_members.role === 'Photographer';
      }).map(assignment => ({
        ...assignment,
        confirmation_status: (assignment.confirmation_status || 'pending') as ConfirmationStatus
      })) || [];

      setAssignedVideographers(videographers);
      setAssignedPhotographers(photographers);
    };

    fetchStaffAssignments();
  }, [eventId]);

  const { data: staff } = useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const { data, error } = await supabase.from("staff_members").select("*");
      if (error) {
        console.error("Error fetching staff:", error);
        throw error;
      }
      return data;
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async (updatedEvent: Partial<Event>) => {
      if (!eventId) {
        throw new Error("Event ID is required");
      }

      // Map camelCase fields to snake_case for database
      const dbUpdateData = {
        name: updatedEvent.name,
        description: updatedEvent.description,
        date: updatedEvent.date,
        start_time: updatedEvent.startTime,
        end_time: updatedEvent.endTime,
      };

      const { data, error } = await supabase
        .from("events")
        .update(dbUpdateData)
        .eq("id", eventId)
        .select()
        .single();

      if (error) {
        console.error("Error updating event:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Event updated successfully.",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update event.",
        variant: "destructive",
      });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async () => {
      if (!eventId) {
        throw new Error("Event ID is required");
      }

      const { data, error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId);

      if (error) {
        console.error("Error deleting event:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Event deleted successfully.",
      });
      navigate("/events");
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete event.",
        variant: "destructive",
      });
    },
  });

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSaveClick = async () => {
    if (!editedName || !editedDescription || !editedDate || !editedStartTime || !editedEndTime) {
      toast({
        title: "Error",
        description: "All fields are required.",
        variant: "destructive",
      });
      return;
    }

    const updatedEvent = {
      name: editedName,
      description: editedDescription,
      date: format(editedDate, "yyyy-MM-dd"),
      startTime: editedStartTime,
      endTime: editedEndTime,
    };

    updateEventMutation.mutate(updatedEvent);
  };

  const handleDeleteClick = () => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      deleteEventMutation.mutate();
    }
  };

  if (isLoading) {
    return <div>Loading event details...</div>;
  }

  if (error || !event) {
    return <div>Error: {error?.message || "Event not found"}</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Event Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{event.name}</h1>
          <p className="text-muted-foreground">
            {format(new Date(event.date), "PPP")} • {event.startTime} - {event.endTime}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate("/events")}>
            Back to Events
          </Button>
          {!isEditing ? (
            <Button onClick={handleEditClick}>Edit Event</Button>
          ) : (
            <div className="flex space-x-2">
              <Button variant="secondary" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveClick} disabled={updateEventMutation.isPending}>
                {updateEventMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Event Details Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Event Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Event Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={
                          "w-[240px] justify-start text-left font-normal" +
                          (editedDate ? "" : " text-muted-foreground")
                        }
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editedDate ? (
                          format(editedDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="center">
                      <Calendar
                        mode="single"
                        selected={editedDate}
                        onSelect={setEditedDate}
                        disabled={(date) =>
                          date > new Date()
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      type="time"
                      id="startTime"
                      value={editedStartTime}
                      onChange={(e) => setEditedStartTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      type="time"
                      id="endTime"
                      value={editedEndTime}
                      onChange={(e) => setEditedEndTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <span className="font-semibold">Description:</span>
                  <p>{event.description || "No description provided"}</p>
                </div>
                <div>
                  <span className="font-semibold">Date:</span>
                  <p>{format(new Date(event.date), "PPP")}</p>
                </div>
                <div>
                  <span className="font-semibold">Time:</span>
                  <p>
                    {event.startTime} - {event.endTime}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Staff Assignments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Staff Assignments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">Videographers</h3>
              {assignedVideographers.length > 0 ? (
                <ul className="list-disc pl-5">
                  {assignedVideographers.map((v) => (
                    <li key={v.staff_id}>{v.staff_members?.name}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No videographers assigned.</p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold">Photographers</h3>
              {assignedPhotographers.length > 0 ? (
                <ul className="list-disc pl-5">
                  {assignedPhotographers.map((p) => (
                    <li key={p.staff_id}>{p.staff_members?.name}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No photographers assigned.</p>
              )}
            </div>

            {/* Attendance Section for Completed Events */}
            {event.status === "Completed" && (
              <div className="mt-6 pt-4 border-t space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Event Attendance
                </h4>
                
                <div>
                  <h5 className="text-xs font-semibold">Videographers</h5>
                  {assignedVideographers.length > 0 ? (
                    <div className="space-y-2">
                      {assignedVideographers.map((v) => (
                        <StaffAttendance
                          key={v.staff_id}
                          staffId={v.staff_id}
                          eventId={eventId!}
                          initialAttendanceStatus={v.attendance_status as AttendanceStatus}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No videographers assigned.</p>
                  )}
                </div>

                <div>
                  <h5 className="text-xs font-semibold">Photographers</h5>
                  {assignedPhotographers.length > 0 ? (
                    <div className="space-y-2">
                      {assignedPhotographers.map((p) => (
                        <StaffAttendance
                          key={p.staff_id}
                          staffId={p.staff_id}
                          eventId={eventId!}
                          initialAttendanceStatus={p.attendance_status as AttendanceStatus}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No photographers assigned.</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Staff Availability Timeline - New Section */}
      {event && (assignedVideographers.length > 0 || assignedPhotographers.length > 0) && (
        <StaffAvailabilityTimeline
          assignedVideographers={assignedVideographers.map(v => v.staff_id)}
          assignedPhotographers={assignedPhotographers.map(p => p.staff_id)}
          eventDate={event.date}
          startTime={event.startTime}
          endTime={event.endTime}
        />
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-4 border-t">
        <Button variant="destructive" onClick={handleDeleteClick} disabled={deleteEventMutation.isPending}>
          {deleteEventMutation.isPending ? "Deleting..." : "Delete Event"}
        </Button>
      </div>
    </div>
  );
}
