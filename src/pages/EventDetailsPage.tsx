
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Video,
  Camera,
  UserX,
  ArrowLeft,
  CheckCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useEvents } from "@/hooks/events/use-events";
import { useStaff } from "@/hooks/use-staff";
import { useIsMobile } from "@/hooks/use-mobile";
import { Event, StaffMember } from "@/types/models";
import EventEditDialog from "@/components/events/event-edit-dialog";
import EventDeleteDialog from "@/components/events/event-delete-dialog";
import SendInvitationButton from "@/components/events/send-invitation-button";
import EventsHeader from "@/components/events/events-header";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import EventDetailsSkeleton from "@/components/loading/event-details-skeleton";

// Helper function to convert 24-hour time to 12-hour format
const formatTime12Hour = (time24: string) => {
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

export default function EventDetailsPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { events, loading, loadEvents, cancelEvent, updateEvent } = useEvents();
  const { staff, loading: staffLoading } = useStaff();
  const isMobile = useIsMobile();
  const [event, setEvent] = useState<Event | null>(null);
  const [assignedVideographers, setAssignedVideographers] = useState<StaffMember[]>([]);
  const [assignedPhotographers, setAssignedPhotographers] = useState<StaffMember[]>([]);
  const [staffAssignments, setStaffAssignments] = useState<Record<string, any>>({});
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [markDoneDialogOpen, setMarkDoneDialogOpen] = useState(false);

  useEffect(() => {
    if (events.length === 0 && !loading) {
      loadEvents();
    }
  }, []);

  const loadAssignmentStatuses = async () => {
    if (!eventId) return;

    try {
      console.log("Loading assignment statuses for event:", eventId);
      
      // Get assignment details including confirmation status
      const { data: assignments, error } = await supabase
        .from("staff_assignments")
        .select(`
          staff_id,
          confirmation_status,
          confirmed_at,
          declined_at
        `)
        .eq("event_id", eventId);

      if (error) {
        console.error("Error loading assignment statuses:", error);
        return;
      }

      console.log("Loaded assignments:", assignments);

      // Group by staff_id and take the most recent assignment for each staff member
      const assignmentMap = assignments?.reduce((acc, assignment) => {
        // For each staff member, store their latest assignment status
        if (!acc[assignment.staff_id]) {
          acc[assignment.staff_id] = {
            confirmationStatus: assignment.confirmation_status,
            confirmedAt: assignment.confirmed_at,
            declinedAt: assignment.declined_at,
          };
        }
        return acc;
      }, {} as Record<string, any>) || {};

      console.log("Assignment map:", assignmentMap);
      setStaffAssignments(assignmentMap);
    } catch (error) {
      console.error("Error loading assignment statuses:", error);
    }
  };

  useEffect(() => {
    if (eventId) {
      loadAssignmentStatuses();
    }
  }, [eventId]);

  // Set up real-time subscription for assignment status changes
  useEffect(() => {
    if (!eventId) return;

    console.log("Setting up real-time subscription for event:", eventId);

    const channel = supabase
      .channel(`assignment-status-changes-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'staff_assignments',
          filter: `event_id=eq.${eventId}`
        },
        (payload) => {
          console.log('Real-time assignment status change received:', payload);
          
          // Reload assignment statuses to get the latest state
          loadAssignmentStatuses();
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      console.log("Cleaning up real-time subscription");
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  useEffect(() => {
    if (events.length > 0 && eventId) {
      const foundEvent = events.find(e => e.id === eventId);
      if (foundEvent) {
        setEvent(foundEvent);
        
        // Debug logging
        console.log("Found event:", foundEvent);
        console.log("Event videographers:", foundEvent.videographers);
        console.log("Event photographers:", foundEvent.photographers);
        
        // Find assigned staff when both event and staff data are available
        if (staff.length > 0) {
          // Find assigned videographers - get unique staff IDs first
          const uniqueVideographerIds = [...new Set(foundEvent.videographers?.map(v => v.staffId) || [])];
          const videographers = staff.filter(s => {
            const isAssignedAsVideographer = uniqueVideographerIds.includes(s.id);
            const hasVideographerRole = s.roles.includes("Videographer");
            return isAssignedAsVideographer && hasVideographerRole;
          });
          
          // Find assigned photographers - get unique staff IDs first
          const uniquePhotographerIds = [...new Set(foundEvent.photographers?.map(p => p.staffId) || [])];
          const photographers = staff.filter(s => {
            const isAssignedAsPhotographer = uniquePhotographerIds.includes(s.id);
            const hasPhotographerRole = s.roles.includes("Photographer");
            return isAssignedAsPhotographer && hasPhotographerRole;
          });
          
          console.log("Filtered videographers:", videographers);
          console.log("Filtered photographers:", photographers);
          
          setAssignedVideographers(videographers);
          setAssignedPhotographers(photographers);
        }
      }
    }
  }, [events, eventId, staff]);

  const handleAfterEdit = () => {
    // Reload both events and assignment statuses after edit
    loadEvents();
    // Reload assignment statuses to ensure UI is in sync
    setTimeout(() => {
      loadAssignmentStatuses();
    }, 1000);
  };

  const handleAfterDelete = () => {
    navigate("/events");
  };

  const handleCancelEvent = async () => {
    if (!event) return;
    
    const success = await cancelEvent(event.id);
    if (success) {
      setCancelDialogOpen(false);
      // The event list will be reloaded by the cancelEvent function
    }
  };

  const handleMarkAsDone = async () => {
    if (!event) return;
    
    const success = await updateEvent(event.id, {
      ...event,
      status: "Completed"
    }, [], []);
    
    if (success) {
      setMarkDoneDialogOpen(false);
      // Don't reload events immediately, just update the local state
      setEvent(prev => prev ? { ...prev, status: "Completed" } : null);
    }
  };

  const getConfirmationBadge = (staffId: string) => {
    const assignment = staffAssignments[staffId];
    console.log(`Getting badge for staff ${staffId}:`, assignment);
    
    if (!assignment) {
      console.log(`No assignment found for staff ${staffId}`);
      return <Badge variant="secondary" className="text-xs">Pending</Badge>;
    }

    const status = assignment.confirmationStatus;
    console.log(`Status for staff ${staffId}:`, status);
    
    if (status === 'confirmed') {
      return <Badge variant="default" className="text-xs bg-green-500 hover:bg-green-600">Confirmed</Badge>;
    } else if (status === 'declined') {
      return <Badge variant="destructive" className="text-xs">Declined</Badge>;
    } else {
      return <Badge variant="secondary" className="text-xs">Pending</Badge>;
    }
  };

  const shouldShowInviteButton = (staffId: string) => {
    const assignment = staffAssignments[staffId];
    return !assignment || assignment.confirmationStatus !== 'declined';
  };

  // Function to get dynamic event status based on current time
  const getEventStatus = (event: Event) => {
    // If event has explicit status (like Cancelled or Completed), use it
    if (event.status === "Cancelled" || event.status === "Completed") {
      return event.status;
    }

    const now = new Date();
    const eventDate = new Date(event.date);
    const startTime = new Date(`${event.date}T${event.startTime}`);
    const endTime = new Date(`${event.date}T${event.endTime}`);

    if (now > endTime) {
      return "Elapsed";
    } else if (now >= startTime && now <= endTime) {
      return "On Going";
    } else {
      return "Upcoming";
    }
  };

  if (loading || staffLoading) {
    return <EventDetailsSkeleton />;
  }

  if (!event) {
    return (
      <div className="flex h-screen flex-col animate-fade-in">
        <EventsHeader 
          onAddEvent={() => {}}
          showEventActions={false}
        />
        <div className="flex items-center justify-center p-12 flex-1 animate-fade-in-up">
          <div className="text-center animate-scale-in">
            <CalendarIcon className="h-8 w-8 mx-auto text-muted-foreground animate-bounce-gentle" />
            <p className="mt-2 text-lg">Event not found</p>
            <Button 
              variant="outline" 
              onClick={() => navigate("/events")}
              className="mt-4 hover-lift"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const dynamicStatus = getEventStatus(event);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Upcoming":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "On Going":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
      case "Elapsed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
      case "Completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "Cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const formattedDate = event.date ? format(new Date(event.date), 'MMMM d, yyyy') : 'No date specified';

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="animate-slide-in-right">
        <EventsHeader 
          onAddEvent={() => {}}
          event={event}
          onEditEvent={() => setEditDialogOpen(true)}
          onDeleteEvent={() => setDeleteDialogOpen(true)}
          showEventActions={true}
        />
      </div>
      
      <div className="p-4 grid gap-4 md:grid-cols-3 animate-fade-in-up">
        <div className="md:col-span-3 space-y-4">
          <Card className="animate-scale-in hover-lift transition-all duration-300">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="transition-colors duration-200 hover:text-primary">Event Details</CardTitle>
                  <p className="text-muted-foreground transition-colors duration-200">{event.logId}</p>
                </div>
                <div className="flex items-center gap-2">
                  {event.status !== "Cancelled" && event.status !== "Completed" && dynamicStatus === "Elapsed" && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setMarkDoneDialogOpen(true)}
                      className="hover-scale transition-all duration-200 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Done
                    </Button>
                  )}
                  {event.status !== "Cancelled" && dynamicStatus === "Upcoming" && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setCancelDialogOpen(true)}
                      className="hover-scale transition-all duration-200"
                    >
                      Cancel Event
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/events")}
                    className="p-2 hover-scale transition-all duration-200"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8 animate-fade-in-up">
                  <div className="flex items-center">
                    <Badge className={`${getStatusColor(dynamicStatus)} mr-2 transition-all duration-200 hover:scale-105`}>
                      {dynamicStatus}
                    </Badge>
                    <Badge variant="outline" className="transition-all duration-200 hover:scale-105">{event.type}</Badge>
                  </div>
                  <div className="flex items-center text-muted-foreground text-sm transition-colors duration-200 hover:text-foreground">
                    <CalendarIcon className="h-4 w-4 mr-2 transition-transform duration-200 hover:scale-110" />
                    {formattedDate}
                  </div>
                  <div className="flex items-center text-muted-foreground text-sm transition-colors duration-200 hover:text-foreground">
                    <Clock className="h-4 w-4 mr-2 transition-transform duration-200 hover:scale-110" />
                    {formatTime12Hour(event.startTime)} - {formatTime12Hour(event.endTime)}
                  </div>
                </div>
                
                <div className="animate-fade-in-up stagger-animation" style={{ '--stagger': 1 } as React.CSSProperties}>
                  <div className="flex items-center text-sm transition-colors duration-200 hover:text-foreground">
                    <MapPin className="h-4 w-4 mr-2 transition-transform duration-200 hover:scale-110" />
                    <span>{event.location}</span>
                  </div>
                </div>

                {event.organizer && (
                  <div className="animate-fade-in-up stagger-animation" style={{ '--stagger': 2 } as React.CSSProperties}>
                    <div className="flex items-center text-sm transition-colors duration-200 hover:text-foreground">
                      <span className="font-medium mr-2">Organizer/s:</span>
                      <span>{event.organizer}</span>
                    </div>
                  </div>
                )}
                
                <Separator className="animate-fade-in-up stagger-animation" style={{ '--stagger': 3 } as React.CSSProperties} />
                
                <div className="animate-fade-in-up stagger-animation" style={{ '--stagger': 4 } as React.CSSProperties}>
                  <h3 className="text-sm font-medium mb-2 transition-colors duration-200 hover:text-primary">Assigned Staff</h3>
                  <div className="space-y-3">
                    {/* Videographers Section */}
                    <div className="animate-fade-in-up stagger-animation" style={{ '--stagger': 5 } as React.CSSProperties}>
                      <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center transition-colors duration-200 hover:text-foreground">
                        <Video className="h-3 w-3 mr-1 transition-transform duration-200 hover:scale-110" />
                        Videographers
                      </h4>
                      {assignedVideographers.length > 0 ? (
                        assignedVideographers.map((videographer, index) => (
                          <div 
                            key={`videographer-${videographer.id}`}
                            className="flex items-center justify-between p-2 bg-muted/50 rounded-md hover-lift transition-all duration-300 animate-fade-in-up stagger-animation"
                            style={{ '--stagger': 6 + index } as React.CSSProperties}
                          >
                            <div className="flex items-center gap-2">
                              <Video className="h-4 w-4 mr-2 text-primary transition-transform duration-200 hover:scale-110" />
                              <span className="text-sm transition-colors duration-200 hover:text-primary">{videographer.name}</span>
                              {getConfirmationBadge(videographer.id)}
                            </div>
                            {shouldShowInviteButton(videographer.id) && (
                              <SendInvitationButton
                                eventId={event.id}
                                staffMember={{
                                  id: videographer.id,
                                  name: videographer.name,
                                  email: videographer.email,
                                  role: "Videographer"
                                }}
                                eventData={{
                                  name: event.name,
                                  date: event.date,
                                  startTime: event.startTime,
                                  endTime: event.endTime,
                                  location: event.location,
                                  type: event.type
                                }}
                              />
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center p-2 bg-muted/30 rounded-md animate-fade-in-up">
                          <UserX className="h-4 w-4 mr-2 text-muted-foreground transition-transform duration-200 hover:scale-110" />
                          <span className="text-sm text-muted-foreground italic transition-colors duration-200">No Videographer Selected</span>
                        </div>
                      )}
                    </div>

                    {/* Photographers Section */}
                    <div className="animate-fade-in-up stagger-animation" style={{ '--stagger': 8 } as React.CSSProperties}>
                      <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center transition-colors duration-200 hover:text-foreground">
                        <Camera className="h-3 w-3 mr-1 transition-transform duration-200 hover:scale-110" />
                        Photographers
                      </h4>
                      {assignedPhotographers.length > 0 ? (
                        assignedPhotographers.map((photographer, index) => (
                          <div 
                            key={`photographer-${photographer.id}`}
                            className="flex items-center justify-between p-2 bg-muted/50 rounded-md hover-lift transition-all duration-300 animate-fade-in-up stagger-animation"
                            style={{ '--stagger': 9 + index } as React.CSSProperties}
                          >
                            <div className="flex items-center gap-2">
                              <Camera className="h-4 w-4 mr-2 text-primary transition-transform duration-200 hover:scale-110" />
                              <span className="text-sm transition-colors duration-200 hover:text-primary">{photographer.name}</span>
                              {getConfirmationBadge(photographer.id)}
                            </div>
                            {shouldShowInviteButton(photographer.id) && (
                              <SendInvitationButton
                                eventId={event.id}
                                staffMember={{
                                  id: photographer.id,
                                  name: photographer.name,
                                  email: photographer.email,
                                  role: "Photographer"
                                }}
                                eventData={{
                                  name: event.name,
                                  date: event.date,
                                  startTime: event.startTime,
                                  endTime: event.endTime,
                                  location: event.location,
                                  type: event.type
                                }}
                              />
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center p-2 bg-muted/30 rounded-md animate-fade-in-up">
                          <UserX className="h-4 w-4 mr-2 text-muted-foreground transition-transform duration-200 hover:scale-110" />
                          <span className="text-sm text-muted-foreground italic transition-colors duration-200">No Photographer Selected</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Event Dialog */}
      {event && (
        <EventEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          event={event}
          onEventUpdated={handleAfterEdit}
        />
      )}

      {/* Delete Event Dialog */}
      {event && (
        <EventDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          event={event}
          onEventDeleted={handleAfterDelete}
        />
      )}

      {/* Cancel Event Dialog */}
      {event && (
        <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Event</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to cancel "{event.name}"? This action will:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Mark the event as cancelled</li>
                  <li>Send cancellation notifications to all assigned staff</li>
                  <li>This action cannot be undone</li>
                </ul>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Event</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancelEvent}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Cancel Event
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Mark as Done Dialog */}
      {event && (
        <AlertDialog open={markDoneDialogOpen} onOpenChange={setMarkDoneDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Mark Event as Done</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to mark "{event.name}" as completed? This action will:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Mark the event status as completed</li>
                  <li>Update the event status in the events list</li>
                  <li>This can be changed later if needed</li>
                </ul>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleMarkAsDone}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Done
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
