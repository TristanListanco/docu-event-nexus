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
  Edit,
  Trash2,
  UserX,
  ArrowLeft
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useEvents } from "@/hooks/use-events";
import { useStaff } from "@/hooks/use-staff";
import { useIsMobile } from "@/hooks/use-mobile";
import { Event, StaffMember } from "@/types/models";
import EventEditDialog from "@/components/events/event-edit-dialog";
import EventDeleteDialog from "@/components/events/event-delete-dialog";
import SendInvitationButton from "@/components/events/send-invitation-button";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

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
  const { events, loading, loadEvents } = useEvents();
  const { staff, loading: staffLoading } = useStaff();
  const isMobile = useIsMobile();
  const [event, setEvent] = useState<Event | null>(null);
  const [assignedVideographers, setAssignedVideographers] = useState<StaffMember[]>([]);
  const [assignedPhotographers, setAssignedPhotographers] = useState<StaffMember[]>([]);
  const [staffAssignments, setStaffAssignments] = useState<Record<string, any>>({});
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (events.length === 0 && !loading) {
      loadEvents();
    }
  }, []);

  useEffect(() => {
    const loadAssignmentStatuses = async () => {
      if (!eventId) return;

      try {
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

        const assignmentMap = assignments?.reduce((acc, assignment) => {
          acc[assignment.staff_id] = {
            confirmationStatus: assignment.confirmation_status,
            confirmedAt: assignment.confirmed_at,
            declinedAt: assignment.declined_at,
          };
          return acc;
        }, {} as Record<string, any>) || {};

        setStaffAssignments(assignmentMap);
      } catch (error) {
        console.error("Error loading assignment statuses:", error);
      }
    };

    if (eventId) {
      loadAssignmentStatuses();
    }
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
          // Find assigned videographers
          const videographers = staff.filter(s => {
            const isAssignedAsVideographer = foundEvent.videographers && 
              foundEvent.videographers.some(v => v.staffId === s.id);
            const hasVideographerRole = s.roles.includes("Videographer");
            return isAssignedAsVideographer && hasVideographerRole;
          });
          
          // Find assigned photographers
          const photographers = staff.filter(s => {
            const isAssignedAsPhotographer = foundEvent.photographers && 
              foundEvent.photographers.some(p => p.staffId === s.id);
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
    loadEvents();
  };

  const handleAfterDelete = () => {
    navigate("/events");
  };

  const getConfirmationBadge = (staffId: string) => {
    const assignment = staffAssignments[staffId];
    if (!assignment) return null;

    const status = assignment.confirmationStatus;
    
    if (status === 'confirmed') {
      return <Badge variant="default" className="text-xs">Confirmed</Badge>;
    } else if (status === 'declined') {
      return <Badge variant="destructive" className="text-xs">Declined</Badge>;
    } else {
      return <Badge variant="secondary" className="text-xs">Pending</Badge>;
    }
  };

  // Function to get dynamic event status based on current time
  const getEventStatus = (event: Event) => {
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
    return (
      <div className="flex items-center justify-center p-12 h-screen">
        <div className="text-center">
          <CalendarIcon className="h-8 w-8 animate-pulse mx-auto text-primary" />
          <p className="mt-2 text-lg">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex items-center justify-center p-12 h-screen">
        <div className="text-center">
          <CalendarIcon className="h-8 w-8 mx-auto text-muted-foreground" />
          <p className="mt-2 text-lg">Event not found</p>
          <Button 
            variant="outline" 
            onClick={() => navigate("/events")}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
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
    <div className="flex flex-col h-full">
      <div className="border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/events")}
              className="p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{event.name}</h1>
              <p className="text-muted-foreground">{event.logId}</p>
            </div>
          </div>
          
          {/* Mobile Action Buttons in Header */}
          {isMobile && (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setEditDialogOpen(true)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
      
      <div className="p-4 grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8">
                  <div className="flex items-center">
                    <Badge className={`${getStatusColor(dynamicStatus)} mr-2`}>
                      {dynamicStatus}
                    </Badge>
                    <Badge variant="outline">{event.type}</Badge>
                  </div>
                  <div className="flex items-center text-muted-foreground text-sm">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {formattedDate}
                  </div>
                  <div className="flex items-center text-muted-foreground text-sm">
                    <Clock className="h-4 w-4 mr-2" />
                    {formatTime12Hour(event.startTime)} - {formatTime12Hour(event.endTime)}
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{event.location}</span>
                  </div>
                </div>

                {event.organizer && (
                  <div>
                    <div className="flex items-center text-sm">
                      <span className="font-medium mr-2">Organizer/s:</span>
                      <span>{event.organizer}</span>
                    </div>
                  </div>
                )}
                
                <Separator />
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Assigned Staff</h3>
                  <div className="space-y-3">
                    {/* Videographers Section */}
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center">
                        <Video className="h-3 w-3 mr-1" />
                        Videographers
                      </h4>
                      {assignedVideographers.length > 0 ? (
                        assignedVideographers.map((videographer) => (
                          <div 
                            key={`videographer-${videographer.id}`}
                            className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                          >
                            <div className="flex items-center gap-2">
                              <Video className="h-4 w-4 mr-2 text-primary" />
                              <span className="text-sm">{videographer.name}</span>
                              {getConfirmationBadge(videographer.id)}
                            </div>
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
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center p-2 bg-muted/30 rounded-md">
                          <UserX className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground italic">No Videographer Selected</span>
                        </div>
                      )}
                    </div>

                    {/* Photographers Section */}
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center">
                        <Camera className="h-3 w-3 mr-1" />
                        Photographers
                      </h4>
                      {assignedPhotographers.length > 0 ? (
                        assignedPhotographers.map((photographer) => (
                          <div 
                            key={`photographer-${photographer.id}`}
                            className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                          >
                            <div className="flex items-center gap-2">
                              <Camera className="h-4 w-4 mr-2 text-primary" />
                              <span className="text-sm">{photographer.name}</span>
                              {getConfirmationBadge(photographer.id)}
                            </div>
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
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center p-2 bg-muted/30 rounded-md">
                          <UserX className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground italic">No Photographer Selected</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Desktop Action Buttons in Sidebar */}
        {!isMobile && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Event Administration</CardTitle>
                <CardDescription>Manage event settings and assignments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" onClick={() => setEditDialogOpen(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Event
                </Button>
                
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Event
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
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
    </div>
  );
}
