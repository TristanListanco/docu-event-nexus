
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, CheckCircle, XCircle, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

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
  action?: string;
  status?: string;
  assignment?: AssignmentData;
  icsFile?: string;
  message?: string;
  error?: string;
  code?: string;
  timestamp?: string;
}

export default function ConfirmAssignmentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const action = searchParams.get("action");
  
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [assignment, setAssignment] = useState<AssignmentData | null>(null);
  const [icsFile, setIcsFile] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [confirmationTimestamp, setConfirmationTimestamp] = useState<string>("");

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
        throw error;
      }

      console.log("Status check response:", data);

      if (data.error) {
        setError(data.error);
        return;
      }

      setStatus(data.status);
      setAssignment(data.assignment);
      setIcsFile(data.icsFile);
      
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
      console.log(`Processing ${confirmAction} action for token:`, token);

      const { data, error } = await supabase.functions.invoke('handle-confirmation', {
        body: {
          token: token,
          action: confirmAction
        }
      });

      if (error) {
        console.error(`Error ${confirmAction}ing:`, error);
        throw error;
      }

      console.log(`${confirmAction} response:`, data);

      if (data.error) {
        setError(data.error);
        return;
      }

      setStatus(data.status);
      setIcsFile(data.icsFile);
      
      // Set the confirmation timestamp from the response
      if (data.timestamp) {
        setConfirmationTimestamp(data.timestamp);
      }

      // Refresh the assignment data
      await checkAssignmentStatus();

    } catch (error: any) {
      console.error(`Error ${confirmAction}ing assignment:`, error);
      setError(error.message || `Failed to ${confirmAction} assignment`);
    } finally {
      setConfirming(false);
    }
  };

  const downloadICS = () => {
    if (!icsFile || !assignment) return;

    const blob = new Blob([icsFile], { type: 'text/calendar' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${assignment.eventName.replace(/\s+/g, '_')}_confirmation.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMMM d, yyyy \'at\' h:mm a');
    } catch (error) {
      return dateString;
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

  const getStatusBadge = () => {
    switch (status) {
      case 'already_confirmed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Confirmed</Badge>;
      case 'already_declined':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Declined</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const isAlreadyProcessed = status === 'already_confirmed' || status === 'already_declined';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-center">Event Assignment Confirmation</CardTitle>
          <div className="text-center">
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Event Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{assignment.eventName}</h3>
            <div className="grid gap-3 text-sm">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{format(new Date(assignment.eventDate), 'MMMM d, yyyy')}</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{assignment.startTime} - {assignment.endTime}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{assignment.location}</span>
              </div>
            </div>
          </div>

          {/* Staff Information */}
          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground">Assigned to:</p>
            <p className="font-medium">{assignment.staffName}</p>
          </div>

          {/* Confirmation Timestamp */}
          {confirmationTimestamp && (
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground">
                {status === 'already_confirmed' ? 'Confirmed on:' : 'Declined on:'}
              </p>
              <p className="font-medium">{formatDateTime(confirmationTimestamp)}</p>
            </div>
          )}

          {/* Action Buttons */}
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

          {/* Calendar Download */}
          {status === 'already_confirmed' && icsFile && (
            <div className="border-t pt-4">
              <Button onClick={downloadICS} variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download Calendar Event
              </Button>
            </div>
          )}

          {/* Message for processed assignments */}
          {isAlreadyProcessed && (
            <div className="text-center text-muted-foreground text-sm">
              {status === 'already_confirmed' 
                ? 'You have already confirmed your attendance for this event.'
                : 'You have already declined this assignment.'
              }
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
