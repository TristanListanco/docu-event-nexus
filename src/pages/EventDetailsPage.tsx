
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
  Trash2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useEvents } from "@/hooks/use-events";
import { useStaff } from "@/hooks/use-staff";
import { Event, StaffMember } from "@/types/models";
import EventEditDialog from "@/components/events/event-edit-dialog";
import EventDeleteDialog from "@/components/events/event-delete-dialog";
import { format } from "date-fns";

export default function EventDetailsPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { events, loading, loadEvents } = useEvents();
  const { staff, loading: staffLoading } = useStaff();
  const [event, setEvent] = useState<Event | null>(null);
  const [assignedVideographers, setAssignedVideographers] = useState<StaffMember[]>([]);
  const [assignedPhotographers, setAssignedPhotographers] = useState<StaffMember[]>([]);
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (events.length === 0 && !loading) {
      loadEvents();
    }
  }, []);

  useEffect(() => {
    if (events.length > 0 && eventId) {
      const foundEvent = events.find(e => e.id === eventId);
      if (foundEvent) {
        setEvent(foundEvent);
        
        // Find assigned staff when both event and staff data are available
        if (staff.length > 0) {
          // Find assigned videographers
          const videographers = staff.filter(s => 
            foundEvent.videographers && foundEvent.videographers.some(v => v.staffId === s.id)
          );
          
          // Find assigned photographers
          const photographers = staff.filter(s => 
            foundEvent.photographers && foundEvent.photographers.some(p => p.staffId === s.id)
          );
          
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
      return event.status; // Keep original status for future events
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
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "Completed":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const formattedDate = event.date ? format(new Date(event.date), 'MMMM d, yyyy') : 'No date specified';

  return (
    <div className="flex flex-col h-full">
      <div className="border-b">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{event.name}</h1>
            <p className="text-muted-foreground">{event.logId}</p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => navigate("/events")}
            >
              Back to Events
            </Button>
          </div>
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
                    {event.startTime} - {event.endTime}
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{event.location}</span>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Assigned Staff</h3>
                  <div className="space-y-3">
                    {assignedVideographers.length > 0 && (
                      <div 
                        className="flex items-center p-2 bg-muted/50 rounded-md"
                      >
                        <Video className="h-4 w-4 mr-2 text-primary" />
                        <span className="text-sm">{assignedVideographers[0].name}</span>
                      </div>
                    )}
                    
                    {assignedPhotographers.length > 0 && (
                      <div 
                        className="flex items-center p-2 bg-muted/50 rounded-md"
                      >
                        <Camera className="h-4 w-4 mr-2 text-primary" />
                        <span className="text-sm">{assignedPhotographers[0].name}</span>
                      </div>
                    )}
                    
                    {assignedVideographers.length === 0 && assignedPhotographers.length === 0 && (
                      <p className="text-sm text-muted-foreground italic">No staff assigned</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
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
