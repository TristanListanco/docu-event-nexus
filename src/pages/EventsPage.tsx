
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calendar as CalendarIcon,
  Search,
  Plus,
  Clock,
  MapPin,
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useEvents } from "@/hooks/use-events";
import { Event } from "@/types/models";
import EventTypeDialog from "@/components/events/event-type-dialog";

export default function EventsPage() {
  const { events, loading } = useEvents();
  const [searchQuery, setSearchQuery] = useState("");
  const [showEventTypeDialog, setShowEventTypeDialog] = useState(false);
  const navigate = useNavigate();

  // Filter events based on search query
  const filteredEvents = events.filter((event) =>
    event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "Upcoming":
        return <Badge variant="secondary">Upcoming</Badge>;
      case "Ongoing":
        return <Badge variant="default" className="bg-green-600">Ongoing</Badge>;
      case "Completed":
        return <Badge variant="outline">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <CalendarIcon className="h-5 w-5 mr-2" />
            <h1 className="text-2xl font-bold tracking-tight">Events</h1>
          </div>
          <Button onClick={() => setShowEventTypeDialog(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Event
          </Button>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search events..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="flex flex-col items-center">
              <CalendarIcon className="h-8 w-8 animate-pulse" />
              <p className="mt-2">Loading events...</p>
            </div>
          </div>
        ) : (
          <>
            {filteredEvents.length === 0 ? (
              <div className="text-center p-8 border rounded-lg">
                <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No events found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {searchQuery
                    ? "Try adjusting your search query"
                    : "Get started by creating your first event"}
                </p>
                <Button 
                  className="mt-4" 
                  onClick={() => setShowEventTypeDialog(true)}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Event
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event Name</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Staff</TableHead>
                      <TableHead className="w-24"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEvents.map((event) => (
                      <TableRow key={event.id} onClick={() => navigate(`/events/${event.id}`)} className="cursor-pointer">
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            {event.name}
                            <span className="text-xs text-muted-foreground mt-1">
                              {event.logId}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <div className="mr-2 h-2 w-2 rounded-full bg-primary" />
                            <div className="flex flex-col">
                              <span>{format(new Date(event.date), "MMM d, yyyy")}</span>
                              <span className="text-xs text-muted-foreground flex items-center mt-1">
                                <Clock className="mr-1 h-3 w-3" /> {event.startTime} - {event.endTime}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <MapPin className="mr-1 h-3 w-3 text-muted-foreground" />
                            <span>{event.location}</span>
                          </div>
                        </TableCell>
                        <TableCell>{event.type}</TableCell>
                        <TableCell>{renderStatusBadge(event.status)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">
                              {event.videographers.length} Videographers
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {event.photographers.length} Photographers
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/events/${event.id}`);
                          }}>
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </div>

      <EventTypeDialog 
        open={showEventTypeDialog}
        onOpenChange={setShowEventTypeDialog}
      />
    </div>
  );
}
