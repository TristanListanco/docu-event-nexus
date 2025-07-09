
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, MapPin, User, Users, CheckCircle, XCircle, Calendar, Edit, Trash2, Ban, ArrowLeft } from "lucide-react";
import { useEvents } from "@/hooks/events/use-events";
import { Event, StaffAssignment, AttendanceStatus, ConfirmationStatus } from "@/types/models";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import CancelledEventOverlay from "@/components/events/cancelled-event-overlay";
import EventEditDialog from "@/components/events/event-edit-dialog";
import SendInvitationButton from "@/components/events/send-invitation-button";

interface ExtendedStaffAssignment extends StaffAssignment {
  staffName?: string;
  staffEmail?: string;
  role?: string;
  manualInvitationSentAt?: string | null;
  lastInvitationSentAt?: string | null;
}

export default function EventDetailsPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { getEvent, deleteEvent, updateEvent, loadEvents, cancelEvent } = useEvents();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [assignmentStatuses, setAssignmentStatuses] = useState<ExtendedStaffAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [markDoneDialogOpen, setMarkDoneDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    if (eventId) {
      loadEventDetails();
      loadAssignmentStatuses();
    }
  }, [eventId]);

  const loadEventDetails = async () => {
    if (!eventId) return;
    
    setLoading(true);
    try {
      const eventData = await getEvent(eventId);
      setEvent(eventData);
    } catch (error) {
      console.error("Error loading event details:", error);
      toast({
        title: "Error",
        description: "Failed to load event details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAssignmentStatuses = async () => {
    if (!eventId || !user) return;

    try {
      const { data, error } = await supabase
        .from('staff_assignments')
        .select(`
          *,
          staff_members!inner(name, email, role)
        `)
        .eq('event_id', eventId)
        .eq('user_id', user.id);

      if (error) throw error;

      const assignments: ExtendedStaffAssignment[] = data?.map(assignment => ({
        staffId: assignment.staff_id,
        staffName: assignment.staff_members.name,
        staffEmail: assignment.staff_members.email,
        role: assignment.staff_members.role,
        attendanceStatus: assignment.attendance_status as AttendanceStatus,
        confirmationStatus: assignment.confirmation_status as ConfirmationStatus,
        confirmedAt: assignment.confirmed_at,
        declinedAt: assignment.declined_at,
        manualInvitationSentAt: (assignment as any).manual_invitation_sent_at,
        lastInvitationSentAt: (assignment as any).last_invitation_sent_at,
      })) || [];

      console.log("Loaded assignment statuses:", assignments);
      setAssignmentStatuses(assignments);
    } catch (error) {
      console.error("Error loading assignment statuses:", error);
    }
  };

  const handleMarkAsDone = async () => {
    if (!event || !eventId) return;
    
    const success = await updateEvent(eventId, { status: "Completed" });
    
    if (success) {
      setMarkDoneDialogOpen(false);
      // Reload the main events to update status display
      await loadEvents();
      // Reload event details to reflect changes
      await loadEventDetails();
      toast({
        title: "Event Completed",
        description: `${event.name} has been marked as completed.`,
      });
    }
  };

  const handleCancel = async () => {
    if (!eventId) return;
    
    const success = await cancelEvent(eventId);
    if (success) {
      setCancelDialogOpen(false);
      // Reload the main events to update status display
      await loadEvents();
      // Reload event details to reflect changes
      await loadEventDetails();
    }
  };

  const handleDelete = async () => {
    if (!eventId) return;
    
    const success = await deleteEvent(eventId);
    if (success) {
      navigate("/events");
    }
  };

  const handleEventUpdated = async () => {
    console.log("Event updated - refreshing data...");
    // Force reload both event details and assignment statuses
    await Promise.all([
      loadEventDetails(),
      loadAssignmentStatuses(),
      loadEvents() // Also reload main events list to sync status
    ]);
    console.log("Data refresh completed");
  };

  const updateAttendanceStatus = async (staffId: string, newStatus: AttendanceStatus) => {
    if (!user || !eventId) return;

    try {
      const { error } = await supabase
        .from('staff_assignments')
        .update({ attendance_status: newStatus })
        .eq('event_id', eventId)
        .eq('staff_id', staffId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setAssignmentStatuses(prev => 
        prev.map(assignment => 
          assignment.staffId === staffId 
            ? { ...assignment, attendanceStatus: newStatus }
            : assignment
        )
      );

      toast({
        title: "Status Updated",
        description: "Attendance status has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating attendance status:", error);
      toast({
        title: "Error",
        description: "Failed to update attendance status",
        variant: "destructive",
      });
    }
  };

  const downloadCalendarEvent = async () => {
    if (!event) return;

    try {
      const response = await supabase.functions.invoke('send-event-notification', {
        body: {
          eventId: event.id,
          eventName: event.name,
          eventDate: event.date,
          startTime: event.startTime,
          endTime: event.endTime,
          location: event.location,
          organizer: event.organizer || '',
          type: event.type,
          assignedStaff: [],
          downloadOnly: true
        }
      });

      if (response.error) throw response.error;

      // Create and trigger download
      const blob = new Blob([response.data], { type: 'text/calendar' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${event.name.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Calendar Downloaded",
        description: "Event has been downloaded to your calendar.",
      });
    } catch (error) {
      console.error("Error downloading calendar:", error);
      toast({
        title: "Error",
        description: "Failed to download calendar event",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      "Upcoming": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      "Ongoing": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      "Completed": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
      "Cancelled": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      "Elapsed": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
    };

    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
        {status}
      </Badge>
    );
  };

  const getConfirmationBadge = (assignment: ExtendedStaffAssignment) => {
    if (assignment.confirmationStatus === 'confirmed') {
      return (
        <div className="flex flex-col items-end gap-1">
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Confirmed
          </Badge>
          {assignment.confirmedAt && (
            <div className="text-xs text-muted-foreground">
              {format(new Date(assignment.confirmedAt), 'MMM d, h:mm a')}
            </div>
          )}
        </div>
      );
    } else if (assignment.confirmationStatus === 'declined') {
      return (
        <div className="flex flex-col items-end gap-1">
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Declined
          </Badge>
          {assignment.declinedAt && (
            <div className="text-xs text-muted-foreground">
              {format(new Date(assignment.declinedAt), 'MMM d, h:mm a')}
            </div>
          )}
        </div>
      );
    } else {
      return (
        <Badge variant="outline" className="text-orange-600 border-orange-300">
          Pending
        </Badge>
      );
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Event Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">The requested event could not be found.</p>
          <Button onClick={() => navigate("/events")}>
            Back to Events
          </Button>
        </div>
      </div>
    );
  }

  const isElapsed = new Date(`${event.date} ${event.endTime}`) < new Date() && event.status !== "Completed";
  const currentStatus = isElapsed && event.status !== "Completed" ? "Elapsed" : event.status;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/events")}
            className="h-10 w-10"
            title="Back to Events"
          >
            <ArrowLeft className="h-5 w-5 text-primary" />
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{event.name}</h1>
            {getStatusBadge(currentStatus)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isElapsed && event.status !== "Completed" && (
            <Button 
              onClick={() => setMarkDoneDialogOpen(true)} 
              className="bg-green-600 hover:bg-green-700"
            >
              Mark as Done
            </Button>
          )}
        </div>
      </div>

      <div className="relative">
        {event.status === "Cancelled" && (
          <CancelledEventOverlay 
            isVisible={true}
            onDelete={handleDelete}
          />
        )}
        
        <div className={event.status === "Cancelled" ? "opacity-50" : ""}>
          {/* Event Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-muted rounded-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                Event Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <CalendarDays className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Date</p>
                      <p className="text-gray-600 dark:text-gray-400">
                        {format(new Date(event.date), 'EEEE, MMMM d, yyyy')}
                        {event.endDate && event.endDate !== event.date && 
                          ` - ${format(new Date(event.endDate), 'EEEE, MMMM d, yyyy')}`
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Time</p>
                      <p className="text-gray-600 dark:text-gray-400">{event.startTime} - {event.endTime}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Location</p>
                      <p className="text-gray-600 dark:text-gray-400">{event.location}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Organizer</p>
                      <p className="text-gray-600 dark:text-gray-400">{event.organizer || "Not specified"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Event Type</p>
                      <p className="text-gray-600 dark:text-gray-400">{event.type}</p>
                    </div>
                  </div>
                  
                  {event.logId && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Log ID</p>
                        <p className="text-gray-600 dark:text-gray-400">{event.logId}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button 
                  onClick={() => setEditDialogOpen(true)} 
                  variant="outline" 
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit Event
                </Button>
                
                <Button 
                  onClick={() => setDeleteDialogOpen(true)} 
                  variant="outline"
                  className="flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Event
                </Button>
                
                {event.status !== "Cancelled" && (
                  <Button 
                    onClick={() => setCancelDialogOpen(true)} 
                    variant="outline" 
                    className="flex items-center gap-2 text-orange-600 border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950 dark:text-orange-400"
                  >
                    <Ban className="h-4 w-4" />
                    Cancel Event
                  </Button>
                )}
              </div>
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
            <CardContent>
              {assignmentStatuses.length > 0 ? (
                <div className="space-y-4">
                  {assignmentStatuses.map((assignment) => (
                    <div key={assignment.staffId} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{assignment.staffName}</h4>
                          <Badge variant="outline">{assignment.role}</Badge>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600 dark:text-gray-400">{assignment.staffEmail}</p>
                        </div>
                        
                        {event.status === "Completed" && (
                          <div className="mt-2">
                            <Select
                              value={assignment.attendanceStatus}
                              onValueChange={(value: AttendanceStatus) => 
                                updateAttendanceStatus(assignment.staffId, value)
                              }
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Completed">Completed</SelectItem>
                                <SelectItem value="Absent">Absent</SelectItem>
                                <SelectItem value="Excused">Excused</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {getConfirmationBadge(assignment)}
                        {/* Always show send invitation button, regardless of confirmation status */}
                        <SendInvitationButton
                          eventId={event.id}
                          staffMember={{
                            id: assignment.staffId,
                            name: assignment.staffName || '',
                            email: assignment.staffEmail || '',
                            role: assignment.role || ''
                          }}
                          eventData={{
                            name: event.name,
                            date: event.date,
                            startTime: event.startTime,
                            endTime: event.endTime,
                            location: event.location,
                            type: event.type
                          }}
                          lastSentAt={assignment.manualInvitationSentAt}
                          onInvitationSent={loadAssignmentStatuses}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No staff members assigned to this event.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mark as Done Dialog */}
      <AlertDialog open={markDoneDialogOpen} onOpenChange={setMarkDoneDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Event as Completed</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark "{event.name}" as completed? This action will change the event status and allow you to track attendance.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleMarkAsDone}>Mark as Done</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Event Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel "{event.name}"? This will notify all assigned staff members about the cancellation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, Keep Event</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} className="bg-orange-600 hover:bg-orange-700">
              Yes, Cancel Event
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{event.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete Event
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {editDialogOpen && (
        <EventEditDialog
          event={event}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onEventUpdated={handleEventUpdated}
        />
      )}
    </div>
  );
}
