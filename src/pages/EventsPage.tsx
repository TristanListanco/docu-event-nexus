
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Plus, RefreshCw, Edit, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEvents } from "@/hooks/use-events";
import { EventType, Event } from "@/types/models";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import EventDeleteDialog from "@/components/events/event-delete-dialog";
import EventEditDialog from "@/components/events/event-edit-dialog";

export default function EventsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { events, loading, loadEvents } = useEvents();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Filter events based on search query
  const filteredEvents = events.filter(event => 
    event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.logId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEventClick = (event: Event) => {
    navigate(`/events/${event.id}`);
  };

  const handleEditEvent = (e: React.MouseEvent, event: Event) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setEditDialogOpen(true);
  };

  const handleDeleteEvent = (e: React.MouseEvent, event: Event) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setDeleteDialogOpen(true);
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

  return (
    <div className="flex flex-col h-full">
      <div className="border-b">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Events</h1>
            <p className="text-muted-foreground">Manage your scheduled events</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => loadEvents()} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => navigate("/events/new")}>
              <Plus className="mr-2 h-4 w-4" /> Add Event
            </Button>
          </div>
        </div>
      </div>
      
      <div className="p-4 flex flex-col space-y-4">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="mt-2 text-lg">Loading events...</p>
            </div>
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            {filteredEvents.map(event => {
              const dynamicStatus = getEventStatus(event);
              return (
                <Card 
                  key={event.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleEventClick(event)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <div className="rounded-full bg-primary/10 w-10 h-10 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex space-x-1">
                        <Badge variant="outline" className="bg-primary/10 text-primary">
                          {event.type}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <span className="sr-only">Open menu</span>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => handleEditEvent(e, event)}>
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Edit Event</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => handleDeleteEvent(e, event)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete Event</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <CardTitle className="mt-2">{event.name}</CardTitle>
                    <p className="text-muted-foreground text-sm">
                      {event.date ? format(new Date(event.date), 'MMM d, yyyy') : 'No date'}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">📍 {event.location}</p>
                    <p className="text-sm">🕒 {event.startTime} - {event.endTime}</p>
                    <div className="flex justify-between mt-2">
                      <Badge className={`
                        ${dynamicStatus === 'Upcoming' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : 
                         dynamicStatus === 'On Going' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100' :
                         dynamicStatus === 'Elapsed' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' :
                         'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'}
                      `}>
                        {dynamicStatus}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Log ID: {event.logId}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No events found</h3>
            <p className="text-muted-foreground text-center mt-2">
              {searchQuery ? 
                "No events match your search criteria. Try a different search term." : 
                "You haven't created any events yet. Click the 'Add Event' button to get started."}
            </p>
            {!searchQuery && (
              <Button onClick={() => navigate("/events/new")} className="mt-4">
                <Plus className="mr-2 h-4 w-4" /> Create Your First Event
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Edit Event Dialog */}
      {selectedEvent && (
        <EventEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          event={selectedEvent}
          onEventUpdated={loadEvents}
        />
      )}

      {/* Delete Event Dialog */}
      {selectedEvent && (
        <EventDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          event={selectedEvent}
          onEventDeleted={loadEvents}
        />
      )}
    </div>
  );
}
