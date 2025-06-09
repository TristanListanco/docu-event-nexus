
import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Clock, MapPin, CheckCircle, XCircle, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface EventDetails {
  id: string;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  organizer?: string;
  type: string;
}

interface AssignmentDetails {
  id: string;
  staffName: string;
  role: string;
  confirmationStatus: string;
  confirmedAt?: string;
  declinedAt?: string;
}

const formatTime12Hour = (time24: string) => {
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

export default function ConfirmAssignmentPage() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [assignment, setAssignment] = useState<AssignmentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const loadAssignmentDetails = async () => {
      if (!token) {
        toast({
          title: "Invalid Link",
          description: "The confirmation link is invalid.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      try {
        // Get assignment details with event and staff information
        const { data: assignmentData, error: assignmentError } = await supabase
          .from("staff_assignments")
          .select(`
            id,
            confirmation_status,
            confirmed_at,
            declined_at,
            events!inner(
              id,
              name,
              date,
              start_time,
              end_time,
              location,
              organizer,
              type
            ),
            staff_members!inner(
              name,
              role
            )
          `)
          .eq("confirmation_token", token)
          .single();

        if (assignmentError || !assignmentData) {
          toast({
            title: "Assignment Not Found",
            description: "The confirmation link is invalid or expired.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        setEvent({
          id: assignmentData.events.id,
          name: assignmentData.events.name,
          date: assignmentData.events.date,
          startTime: assignmentData.events.start_time,
          endTime: assignmentData.events.end_time,
          location: assignmentData.events.location,
          organizer: assignmentData.events.organizer,
          type: assignmentData.events.type,
        });

        setAssignment({
          id: assignmentData.id,
          staffName: assignmentData.staff_members.name,
          role: assignmentData.staff_members.role,
          confirmationStatus: assignmentData.confirmation_status,
          confirmedAt: assignmentData.confirmed_at,
          declinedAt: assignmentData.declined_at,
        });
      } catch (error: any) {
        console.error("Error loading assignment:", error);
        toast({
          title: "Error",
          description: "Failed to load assignment details.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadAssignmentDetails();
  }, [token]);

  const handleConfirmation = async (confirm: boolean) => {
    if (!assignment || !event) return;

    setProcessing(true);
    try {
      const updateData = confirm
        ? {
            confirmation_status: "confirmed",
            confirmed_at: new Date().toISOString(),
            declined_at: null,
          }
        : {
            confirmation_status: "declined",
            declined_at: new Date().toISOString(),
            confirmed_at: null,
          };

      const { error } = await supabase
        .from("staff_assignments")
        .update(updateData)
        .eq("id", assignment.id);

      if (error) {
        throw error;
      }

      setAssignment(prev => prev ? {
        ...prev,
        confirmationStatus: confirm ? "confirmed" : "declined",
        confirmedAt: confirm ? new Date().toISOString() : undefined,
        declinedAt: !confirm ? new Date().toISOString() : undefined,
      } : null);

      toast({
        title: confirm ? "Assignment Confirmed" : "Assignment Declined",
        description: confirm 
          ? "Thank you for confirming your assignment. The calendar file will download automatically."
          : "You have declined this assignment.",
      });

      // If confirmed, automatically download the .ics file
      if (confirm) {
        setTimeout(() => {
          downloadCalendarFile();
        }, 1000);
      }
    } catch (error: any) {
      console.error("Error updating assignment:", error);
      toast({
        title: "Error",
        description: "Failed to update assignment status.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const downloadCalendarFile = async () => {
    if (!event || !assignment) return;

    try {
      const { data, error } = await supabase.functions.invoke('send-event-notification', {
        body: {
          eventId: event.id,
          eventName: event.name,
          eventDate: event.date,
          startTime: event.startTime,
          endTime: event.endTime,
          location: event.location,
          organizer: event.organizer,
          type: event.type,
          downloadOnly: true,
          assignedStaff: [{
            id: assignment.id,
            name: assignment.staffName,
            role: assignment.role
          }]
        }
      });

      if (error) {
        throw error;
      }

      // Create and download the .ics file
      const icsContent = data.icsContent;
      const blob = new Blob([icsContent], { type: 'text/calendar' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${event.name.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Error downloading calendar file:", error);
      toast({
        title: "Download Error",
        description: "Failed to download calendar file. You can request it again from the event organizer.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 h-screen">
        <div className="text-center">
          <CalendarIcon className="h-8 w-8 animate-pulse mx-auto text-primary" />
          <p className="mt-2 text-lg">Loading assignment details...</p>
        </div>
      </div>
    );
  }

  if (!event || !assignment) {
    return (
      <div className="flex items-center justify-center p-12 h-screen">
        <Card className="max-w-md">
          <CardContent className="text-center p-6">
            <XCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Assignment Not Found</h2>
            <p className="text-muted-foreground">
              The confirmation link is invalid or has expired.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formattedDate = format(new Date(event.date), 'MMMM d, yyyy');
  const isAlreadyResponded = assignment.confirmationStatus !== 'pending';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-center">Event Assignment Confirmation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Event Details */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-3">{event.name}</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{formattedDate}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{formatTime12Hour(event.startTime)} - {formatTime12Hour(event.endTime)}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{event.location}</span>
                  </div>
                  {event.organizer && (
                    <div className="flex items-center">
                      <span className="font-medium mr-2">Organizer:</span>
                      <span>{event.organizer}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{event.type}</Badge>
                    <Badge variant="secondary">{assignment.role}</Badge>
                  </div>
                </div>
              </div>

              {/* Assignment Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Assignment Details</h4>
                <p className="text-sm">
                  Hello <strong>{assignment.staffName}</strong>, you have been assigned as the <strong>{assignment.role}</strong> for this event.
                </p>
                
                {isAlreadyResponded && (
                  <div className="mt-3">
                    <Badge 
                      variant={assignment.confirmationStatus === 'confirmed' ? 'default' : 'destructive'}
                      className="flex items-center gap-1 w-fit"
                    >
                      {assignment.confirmationStatus === 'confirmed' ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      {assignment.confirmationStatus === 'confirmed' ? 'Confirmed' : 'Declined'}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      {assignment.confirmationStatus === 'confirmed' 
                        ? `Confirmed on ${format(new Date(assignment.confirmedAt!), 'MMM d, yyyy h:mm a')}`
                        : `Declined on ${format(new Date(assignment.declinedAt!), 'MMM d, yyyy h:mm a')}`
                      }
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {!isAlreadyResponded && (
                <div className="flex gap-4 justify-center">
                  <Button
                    onClick={() => handleConfirmation(true)}
                    disabled={processing}
                    className="min-w-32"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {processing ? "Processing..." : "Accept Assignment"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleConfirmation(false)}
                    disabled={processing}
                    className="min-w-32"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Decline Assignment
                  </Button>
                </div>
              )}

              {/* Download Calendar Button for Confirmed Assignments */}
              {assignment.confirmationStatus === 'confirmed' && (
                <div className="text-center">
                  <Button onClick={downloadCalendarFile} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download Calendar File
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
