import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, MapPin, User, Users, CheckCircle, XCircle, Calendar, Edit, Ban, ArrowLeft } from "lucide-react";
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
import EventDetailsSkeleton from "@/components/loading/event-details-skeleton";

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

      // Auto-decline pending confirmations for ongoing events
      if (event && event.status === "Ongoing") {
        await autoDeclinePendingConfirmations(assignments);
      }
    } catch (error) {
      console.error("Error loading assignment statuses:", error);
    }
  };

  const autoDeclinePendingConfirmations = async (assignments: ExtendedStaffAssignment[]) => {
    const pendingAssignments = assignments.filter(
      assignment => assignment.confirmationStatus === 'pending'
    );

    if (pendingAssignments.length === 0) return;

    try {
      const updates = pendingAssignments.map(assignment => 
        supabase
          .from('staff_assignments')
          .update({
            confirmation_status: 'declined',
            declined_at: new Date().toISOString()
          })
          .eq('event_id', eventId)
          .eq('staff_id', assignment.staffId)
          .eq('user_id', user!.id)
      );

      await Promise.all(updates);

      // Update local state
      setAssignmentStatuses(prev => 
        prev.map(assignment => 
          assignment.confirmationStatus === 'pending'
            ? {
                ...assignment,
                confirmationStatus: 'declined' as ConfirmationStatus,
                declinedAt: new Date().toISOString()
              }
            : assignment
        )
      );

      if (pendingAssignments.length > 0) {
        toast({
          title: "Auto-declined Pending Confirmations",
          description: `${pendingAssignments.length} pending confirmation(s) have been automatically declined as the event is ongoing.`,
        });
      }
    } catch (error) {
      console.error("Error auto-declining pending confirmations:", error);
    }
  };

  const handleMarkAsDone = async () => {
    if (!event || !eventId) return;
    
    const success = await updateEvent(eventId, { status: "Completed" });
    
    if (success) {
      setMarkDoneDialogOpen(false);
      await loadEvents();
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
      await loadEvents();
      await loadEventDetails();
    }
  };


  const handleEventUpdated = async () => {
    console.log("Event updated - refreshing data...");
    await Promise.all([
      loadEventDetails(),
      loadAssignmentStatuses(),
      loadEvents()
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

      setAssignmentStatuses(prev => 
        prev.map(assignment => 
          assignment.staffId === staffId 
            ? { ...assignment, attendanceStatus: newStatus }
            : assignment
        )
      );

      toast({
        title: "Attendance Recorded",
        description: "Attendance status has been saved successfully.",
      });
    } catch (error) {
      console.error("Error updating attendance status:", error);
      toast({
        title: "Error",
        description: "Failed to save attendance status",
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

  useEffect(() => {
    if (event && event.status === "Ongoing" && assignmentStatuses.length > 0) {
      autoDeclinePendingConfirmations(assignmentStatuses);
    }
  }, [event?.status]);

  if (loading) {
    return <EventDetailsSkeleton />;
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Event Not Found</h1>
              <p className="text-gray-600 dark:text-gray-400 mb-4">The requested event could not be found.</p>
              <Button onClick={() => navigate("/events")}>
                Back to Events
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isElapsed = new Date(`${event.date} ${event.endTime}`) < new Date() && event.status !== "Completed";
  const isOngoing = event.status === "Ongoing";
  const isCompleted = event.status === "Completed";
  const currentStatus = isElapsed && event.status !== "Completed" ? "Elapsed" : event.status;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Header with Back Button - Mobile Optimized */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/events")}
              className="h-10 w-10 shrink-0"
              title="Back to Events"
            >
              <ArrowLeft className="h-5 w-5 text-primary" />
            </Button>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 truncate">{event.name}</h1>
              {getStatusBadge(currentStatus)}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isElapsed && event.status !== "Completed" && (
              <Button 
                onClick={() => setMarkDoneDialogOpen(true)} 
                className="bg-green-600 hover:bg-green-700 text-sm md:text-base"
                size="sm"
              >
                Mark as Done
              </Button>
            )}
          </div>
        </div>

        <div className="relative">
          {event.status === "Cancelled" && (
            <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center rounded-lg">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg text-center">
                <h3 className="text-2xl font-bold text-red-600 mb-2">Event Cancelled</h3>
                <p className="text-gray-600 dark:text-gray-400">This event has been cancelled</p>
              </div>
            </div>
          )}
          
          <div className={event.status === "Cancelled" ? "opacity-50" : ""}>
            {/* Event Details Card - Mobile Optimized */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <div className="p-2 bg-muted rounded-lg">
                    <Calendar className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  </div>
                  Event Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-muted rounded-lg shrink-0">
                        <CalendarDays className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm md:text-base">Date</p>
                        <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base break-words">
                          {format(new Date(event.date), 'EEEE, MMMM d, yyyy')}
                          {event.endDate && event.endDate !== event.date && 
                            ` - ${format(new Date(event.endDate), 'EEEE, MMMM d, yyyy')}`
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-muted rounded-lg shrink-0">
                        <Clock className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm md:text-base">Time</p>
                        <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">{event.startTime} - {event.endTime}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-muted rounded-lg shrink-0">
                        <MapPin className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm md:text-base">Location</p>
                        <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base break-words">{event.location}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-muted rounded-lg shrink-0">
                        <User className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm md:text-base">Organizer</p>
                        <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base break-words">{event.organizer || "Not specified"}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-muted rounded-lg shrink-0">
                        <Users className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm md:text-base">Event Type</p>
                        <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">{event.type}</p>
                      </div>
                    </div>
                    
                    {event.logId && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-muted rounded-lg shrink-0">
                          <Calendar className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm md:text-base">Log ID</p>
                          <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base break-all">{event.logId}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
                  <Button 
                    onClick={() => setEditDialogOpen(true)} 
                    variant="outline" 
                    className="flex items-center gap-2 text-sm"
                    size="sm"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Event
                  </Button>
                  
                  {event.status !== "Cancelled" && !isOngoing && !isElapsed && !isCompleted && (
                    <Button 
                      onClick={() => setCancelDialogOpen(true)} 
                      variant="outline" 
                      className="flex items-center gap-2 text-orange-600 border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950 dark:text-orange-400 text-sm"
                      size="sm"
                    >
                      <Ban className="h-4 w-4" />
                      Cancel Event
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Staff Assignments - Mobile Optimized */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <Users className="h-4 w-4 md:h-5 md:w-5" />
                  Staff Assignments
                </CardTitle>
              </CardHeader>
              <CardContent>
                {assignmentStatuses.length > 0 ? (
                  <div className="space-y-4">
                    {assignmentStatuses.map((assignment) => (
                      <div key={assignment.staffId} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                            <h4 className="font-medium text-sm md:text-base truncate">{assignment.staffName}</h4>
                            <Badge variant="outline" className="text-xs w-fit">{assignment.role}</Badge>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-gray-600 dark:text-gray-400 break-all">{assignment.staffEmail}</p>
                          </div>
                          
                          {(isCompleted || isElapsed) && (
                            <div className="mt-2">
                              {assignment.attendanceStatus === "Pending" ? (
                                <Select
                                  value={assignment.attendanceStatus}
                                  onValueChange={(value: AttendanceStatus) => 
                                    updateAttendanceStatus(assignment.staffId, value)
                                  }
                                >
                                  <SelectTrigger className="w-full sm:w-40">
                                    <SelectValue placeholder="Mark attendance" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Completed">Present</SelectItem>
                                    <SelectItem value="Absent">Absent</SelectItem>
                                    <SelectItem value="Excused">Excused</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="font-medium">Attendance:</span>
                                  <Badge 
                                    variant="secondary"
                                    className={
                                      assignment.attendanceStatus === "Completed" 
                                        ? "bg-green-100 text-green-800" 
                                        : assignment.attendanceStatus === "Absent"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-gray-100 text-gray-800"
                                    }
                                  >
                                    {assignment.attendanceStatus === "Completed" ? "Present" : assignment.attendanceStatus}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                          {getConfirmationBadge(assignment)}
                          {assignment.confirmationStatus !== 'confirmed' && assignment.confirmationStatus !== 'declined' && (
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
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8 text-sm md:text-base">
                    No staff members assigned to this event.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

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

        {editDialogOpen && (
          <EventEditDialog
            event={event}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            onEventUpdated={handleEventUpdated}
          />
        )}
      </div>
    </div>
  );
}
