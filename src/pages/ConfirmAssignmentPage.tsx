
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, CheckCircle, XCircle, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

interface AssignmentData {
  id: string;
  eventName: string;
  staffName: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string;
}

interface ConfirmationResponse {
  success?: boolean;
  status?: string;
  assignment?: AssignmentData;
  message?: string;
  error?: string;
  timestamp?: string;
}

export default function ConfirmAssignmentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [assignment, setAssignment] = useState<AssignmentData | null>(null);
  const [error, setError] = useState<string>("");
  const [confirmationTimestamp, setConfirmationTimestamp] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const downloadCalendarEvent = async () => {
    if (!assignment) return;

    try {
      // Format the date properly for the calendar function
      const eventDate = new Date(assignment.eventDate).toISOString().split('T')[0];
      
      const { data, error } = await supabase.functions.invoke('send-event-notification', {
        body: {
          eventId: assignment.id,
          eventName: assignment.eventName,
          eventDate: eventDate,
          startTime: assignment.startTime,
          endTime: assignment.endTime,
          location: assignment.location,
          organizer: '',
          type: 'General',
          assignedStaff: [],
          downloadOnly: true
        }
      });

      if (error) {
        console.error("Calendar download error:", error);
        throw new Error(error.message || "Failed to generate calendar file");
      }

      if (!data) {
        throw new Error("No calendar data received");
      }

      // Create and trigger download
      const blob = new Blob([data], { type: 'text/calendar; charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${assignment.eventName.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Calendar Downloaded",
        description: "Event has been added to your calendar.",
      });
    } catch (error: any) {
      console.error("Error downloading calendar:", error);
      toast({
        title: "Download Failed", 
        description: error.message || "Failed to download calendar event",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!token) {
      setError("No confirmation token provided");
      setLoading(false);
      return;
    }

    checkAssignmentStatus();
  }, [token]);

  const checkAssignmentStatus = async () => {
    try {
      setLoading(true);
      console.log("Checking assignment status for token:", token);

      const { data, error } = await supabase.functions.invoke('handle-confirmation', {
        body: {
          token: token,
          action: 'check'
        }
      });

      if (error) {
        console.error("Error checking status:", error);
        throw new Error(error.message || "Failed to check status");
      }

      console.log("Status check response:", data);

      if (data.error) {
        setError(data.error);
        return;
      }

      setStatus(data.status);
      setAssignment(data.assignment);
      
      // If there's a timestamp, format it for display
      if (data.timestamp) {
        setConfirmationTimestamp(data.timestamp);
      }

    } catch (error: any) {
      console.error("Error checking assignment status:", error);
      setError(error.message || "Failed to check assignment status");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmation = async (confirmAction: 'confirm' | 'decline') => {
    if (!token) return;

    try {
      setConfirming(true);
      setError("");
      setSuccessMessage("");
      
      console.log(`Processing ${confirmAction} action for token:`, token);

      const { data, error } = await supabase.functions.invoke('handle-confirmation', {
        body: {
          token: token,
          action: confirmAction
        }
      });

      if (error) {
        console.error(`Error ${confirmAction}ing:`, error);
        throw new Error(error.message || `Failed to ${confirmAction} assignment`);
      }

      console.log(`${confirmAction} response:`, data);

      if (data.error) {
        setError(data.error);
        return;
      }

      // Handle successful response
      if (data.success) {
        setStatus(data.status);
        setSuccessMessage(data.message || `Assignment ${confirmAction}ed successfully`);
        
        // Set the confirmation timestamp from the response
        if (data.timestamp) {
          setConfirmationTimestamp(data.timestamp);
        }

        // Show toast notification
        toast({
          title: `Assignment ${confirmAction === 'confirm' ? 'Confirmed' : 'Declined'}`,
          description: `You have ${confirmAction}ed your assignment for ${assignment?.eventName}`,
        });

        // Auto-download calendar for confirmed assignments
        if (confirmAction === 'confirm') {
          setTimeout(() => {
            downloadCalendarEvent();
          }, 1000);
        }

        // Refresh the assignment data
        await checkAssignmentStatus();
      } else {
        setError("Unexpected response format");
      }

    } catch (error: any) {
      console.error(`Error ${confirmAction}ing assignment:`, error);
      setError(error.message || `Failed to ${confirmAction} assignment`);
    } finally {
      setConfirming(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMMM d, yyyy \'at\' h:mm a');
    } catch (error) {
      return dateString;
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle className="h-3 w-3 mr-1" />Confirmed</Badge>;
      case 'declined':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"><XCircle className="h-3 w-3 mr-1" />Declined</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading assignment details...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate('/')} className="w-full">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <p className="text-center">No assignment found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isAlreadyProcessed = status === 'confirmed' || status === 'declined';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-center">
            {isAlreadyProcessed 
              ? `Event ${status === 'confirmed' ? 'Confirmed' : 'Declined'}`
              : "Event Assignment Confirmation"
            }
          </CardTitle>
          <div className="text-center">
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Success Message */}
          {successMessage && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-green-800 dark:text-green-200 text-center font-medium">
                {successMessage}
              </p>
            </div>
          )}

          {/* Already processed message */}
          {isAlreadyProcessed && (
            <div className={`p-4 rounded-lg border ${
              status === 'confirmed' 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              <p className={`text-center font-medium ${
                status === 'confirmed' 
                  ? 'text-green-800 dark:text-green-200' 
                  : 'text-red-800 dark:text-red-200'
              }`}>
                You have already {status} your attendance for this event.
              </p>
            </div>
          )}

          {/* Event Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{assignment?.eventName}</h3>
            <div className="grid gap-3 text-sm">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{assignment?.eventDate && format(new Date(assignment.eventDate), 'MMMM d, yyyy')}</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{assignment?.startTime} - {assignment?.endTime}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{assignment?.location}</span>
              </div>
            </div>
          </div>

          {/* Staff Information */}
          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground">Assigned to:</p>
            <p className="font-medium">{assignment?.staffName}</p>
          </div>

          {/* Confirmation Timestamp */}
          {confirmationTimestamp && (
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground">
                {status === 'confirmed' ? 'Confirmed on:' : 'Declined on:'}
              </p>
              <p className="font-medium">{formatDateTime(confirmationTimestamp)}</p>
            </div>
          )}

          {/* Action Buttons for pending assignments */}
          {!isAlreadyProcessed && (
            <div className="flex gap-4 pt-4">
              <Button
                onClick={() => handleConfirmation('confirm')}
                disabled={confirming}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {confirming ? 'Processing...' : 'Confirm Attendance'}
              </Button>
              <Button
                onClick={() => handleConfirmation('decline')}
                disabled={confirming}
                variant="destructive"
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                {confirming ? 'Processing...' : 'Decline'}
              </Button>
            </div>
          )}

          {/* Calendar download for confirmed assignments */}
          {isAlreadyProcessed && status === 'confirmed' && (
            <div className="flex justify-center pt-4">
              <Button 
                onClick={downloadCalendarEvent}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download Calendar Event
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
