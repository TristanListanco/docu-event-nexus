
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  ArrowUp, 
  ArrowDown,
  Edit,
  Trash2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useEvents } from "@/hooks/use-events";
import { useStaff } from "@/hooks/use-staff";
import { Event, StaffMember } from "@/types/models";

export default function EventDetailsPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { events, loading } = useEvents();
  const { staff } = useStaff();
  const [event, setEvent] = useState<Event | null>(null);
  const [assignedVideographers, setAssignedVideographers] = useState<StaffMember[]>([]);
  const [assignedPhotographers, setAssignedPhotographers] = useState<StaffMember[]>([]);

  useEffect(() => {
    if (events.length > 0 && eventId) {
      const foundEvent = events.find(e => e.id === eventId);
      if (foundEvent) {
        setEvent(foundEvent);
        
        // Find assigned staff
        const videographers = staff.filter(s => 
          foundEvent.videographers.some(v => v.staffId === s.id)
        );
        
        const photographers = staff.filter(s => 
          foundEvent.photographers.some(p => p.staffId === s.id)
        );
        
        setAssignedVideographers(videographers);
        setAssignedPhotographers(photographers);
      }
    }
  }, [events, eventId, staff]);

  if (loading) {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Upcoming":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "Ongoing":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "Completed":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

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
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit Event
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
                    <Badge className={`${getStatusColor(event.status)} mr-2`}>
                      {event.status}
                    </Badge>
                    <Badge variant="outline">{event.type}</Badge>
                  </div>
                  <div className="flex items-center text-muted-foreground text-sm">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {event.date}
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
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <h4 className="text-xs text-muted-foreground mb-1 flex items-center">
                        <ArrowUp className="h-3 w-3 mr-1" />
                        VIDEOGRAPHERS
                      </h4>
                      {assignedVideographers.length > 0 ? (
                        <div className="space-y-2">
                          {assignedVideographers.map(videographer => (
                            <div 
                              key={videographer.id}
                              className="flex items-center p-2 bg-muted/50 rounded-md"
                            >
                              <Avatar className="h-6 w-6 mr-2">
                                <AvatarImage src={videographer.photoUrl} alt={videographer.name} />
                                <AvatarFallback className="text-xs">
                                  {videographer.name.split(" ").map(n => n[0]).join("")}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{videographer.name}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No videographers assigned</p>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs text-muted-foreground mb-1 flex items-center">
                        <ArrowDown className="h-3 w-3 mr-1" />
                        PHOTOGRAPHERS
                      </h4>
                      {assignedPhotographers.length > 0 ? (
                        <div className="space-y-2">
                          {assignedPhotographers.map(photographer => (
                            <div 
                              key={photographer.id}
                              className="flex items-center p-2 bg-muted/50 rounded-md"
                            >
                              <Avatar className="h-6 w-6 mr-2">
                                <AvatarImage src={photographer.photoUrl} alt={photographer.name} />
                                <AvatarFallback className="text-xs">
                                  {photographer.name.split(" ").map(n => n[0]).join("")}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{photographer.name}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No photographers assigned</p>
                      )}
                    </div>
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
              <Button className="w-full">
                <Edit className="h-4 w-4 mr-2" />
                Edit Event
              </Button>
              
              <Button variant="destructive" className="w-full">
                <Trash2 className="h-4 w-4 mr-2" />
                Cancel Event
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
