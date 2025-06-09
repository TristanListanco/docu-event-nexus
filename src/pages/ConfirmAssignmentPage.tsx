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
  tokenExpiresAt?: string;
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
  const [tokenNotFound, setTokenNotFound] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadAssignmentDetails = async () => {
      if (!token) {
        console.log("No token provided in URL");
        setErrorMessage("No confirmation token found in the URL.");
        setTokenNotFound(true);
        setLoading(false);
        return;
      }

      console.log("Loading assignment for token:", token);

      try {
        // Enhanced query with token expiry check
        const { data: assignmentData, error: assignmentError } = await supabase
          .from("staff_assignments")
          .select(`
            id,
            confirmation_status,
            confirmed_at,
            declined_at,
            confirmation_token,
            confirmation_token_expires_at,
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

        console.log("Assignment query result:", { assignmentData, assignmentError });

        if (assignmentError) {
          console.error("Assignment error:", assignmentError);
          if (assignmentError.code === 'PGRST116') {
            setErrorMessage("This confirmation link is invalid or has expired. Please contact the event organizer for a new link.");
            setTokenNotFound(true);
          } else {
            setErrorMessage(`Unable to load assignment details. Error: ${assignmentError.message}`);
            setTokenNotFound(true);
          }
          setLoading(false);
          return;
        }

        if (!assignmentData) {
          console.log("No assignment data returned");
          setErrorMessage("This confirmation link is invalid or has expired. Please contact the event organizer for a new link.");
          setTokenNotFound(true);
          setLoading(false);
          return;
        }

        // Check if token has expired
        if (assignmentData.confirmation_token_expires_at) {
          const expiryDate = new Date(assignmentData.confirmation_token_expires_at);
          const now = new Date();
          
          if (now > expiryDate) {
            console.log("Token has expired");
            setErrorMessage("This confirmation link has expired. Please contact the event organizer for a new confirmation link.");
            setTokenNotFound(true);
            setLoading(false);
            return;
          }
        }

        console.log("Assignment found:", assignmentData);

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
          tokenExpiresAt: assignmentData.confirmation_token_expires_at,
        });
      } catch (error: any) {
        console.error("Error loading assignment:", error);
        setErrorMessage("An unexpected error occurred while loading the assignment details. Please check your internet connection and try again.");
        setTokenNotFound(true);
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
        description: "Failed to update assignment status. Please check your internet connection and try again.",
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
      <div className="flex items-center justify-center p-12 h-screen bg-background text-foreground">
        <div className="text-center">
          <CalendarIcon className="h-8 w-8 animate-pulse mx-auto text-primary" />
          <p className="mt-2 text-lg">Loading assignment details...</p>
        </div>
      </div>
    );
  }

  if (tokenNotFound || !event || !assignment) {
    return (
      <div className="flex items-center justify-center p-12 h-screen bg-background text-foreground">
        <Card className="max-w-md">
          <CardContent className="text-center p-6">
            <XCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Assignment Not Found</h2>
            <p className="text-muted-foreground mb-4">
              {errorMessage || "The confirmation link is invalid or has expired."}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Please contact the event organizer for a new confirmation link.
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
              className="w-full"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formattedDate = format(new Date(event.date), 'MMMM d, yyyy');
  const isAlreadyResponded = assignment.confirmationStatus !== 'pending';

  // Check if token is expiring soon (within 24 hours)
  const isExpiringSoon = assignment.tokenExpiresAt && 
    new Date(assignment.tokenExpiresAt).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000;

  return (
    <div className="min-h-screen bg-background text-foreground py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-center">Event Assignment Confirmation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Token expiry warning */}
              {isExpiringSoon && assignment.confirmationStatus === 'pending' && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>Reminder:</strong> This confirmation link expires soon. Please respond as soon as possible.
                    </p>
                  </div>
                </div>
              )}

              {/* Event Details */}
              <div className="bg-primary/10 dark:bg-primary/20 p-4 rounded-lg">
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
              <div className="bg-muted/50 p-4 rounded-lg">
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
