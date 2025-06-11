
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Check, X, Download, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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

export default function ConfirmAssignmentPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [loading, setLoading] = useState(false);
  const [assignment, setAssignment] = useState<AssignmentData | null>(null);
  const [status, setStatus] = useState<'pending' | 'confirmed' | 'declined' | 'already_confirmed' | 'already_declined' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [icsContent, setIcsContent] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [confirmationTimestamp, setConfirmationTimestamp] = useState<string | null>(null);

  // Get IP address for confirmation
  const getClientInfo = () => {
    return {
      userAgent: navigator.userAgent,
      ipAddress: 'client-detected' // Will be detected server-side
    };
  };

  // Function to check current status using the edge function
  const checkCurrentStatus = async () => {
    if (!token) {
      setError("No confirmation token provided");
      setInitialLoading(false);
      return;
    }

    setInitialLoading(true);
    try {
      const clientInfo = getClientInfo();
      
      // Use the handle-confirmation function to check status without taking action
      const { data, error: statusError } = await supabase.functions.invoke('handle-confirmation', {
        body: {
          token,
          action: 'check', // We'll modify the function to handle 'check' action
          ...clientInfo
        }
      });

      if (statusError) {
        throw statusError;
      }

      if (data.assignment) {
        setAssignment(data.assignment);
      }

      if (data.status) {
        setStatus(data.status);
        if (data.icsFile && (data.status === 'confirmed' || data.status === 'already_confirmed')) {
          setIcsContent(data.icsFile);
        }
        // Set confirmation timestamp if available
        if (data.timestamp) {
          setConfirmationTimestamp(data.timestamp);
        }
      }

    } catch (error: any) {
      console.error("Error checking status:", error);
      setError("Unable to check assignment status");
    } finally {
      setInitialLoading(false);
    }
  };

  const handleConfirmation = async (action: 'confirm' | 'decline') => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const clientInfo = getClientInfo();
      
      const { data, error: confirmError } = await supabase.functions.invoke('handle-confirmation', {
        body: {
          token,
          action,
          ...clientInfo
        }
      });

      if (confirmError) {
        throw confirmError;
      }

      if (data.success || data.status?.includes('already_')) {
        setAssignment(data.assignment);
        setStatus(data.status || (action === 'confirm' ? 'confirmed' : 'declined'));
        
        // Set confirmation timestamp
        if (data.timestamp) {
          setConfirmationTimestamp(data.timestamp);
        }
        
        if (data.icsFile && action === 'confirm') {
          setIcsContent(data.icsFile);
          // Auto-download the ICS file
          const blob = new Blob([data.icsFile], { type: 'text/calendar' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${data.assignment.eventName.replace(/[^a-z0-9]/gi, '_')}.ics`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }

        const message = action === 'confirm' 
          ? "Successfully confirmed your assignment!" 
          : "Successfully declined the assignment.";
        
        toast({
          title: "Success",
          description: message,
        });
      }
    } catch (error: any) {
      console.error("Confirmation error:", error);
      setError(error.message || "An error occurred during confirmation");
      toast({
        title: "Error",
        description: error.message || "Failed to process confirmation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadICS = () => {
    if (!icsContent || !assignment) return;
    
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${assignment.eventName.replace(/[^a-z0-9]/gi, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatTime12Hour = (time24: string) => {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Auto-load status if we have assignment data from URL params
  useEffect(() => {
    const eventName = searchParams.get('event');
    const staffName = searchParams.get('staff');
    const eventDate = searchParams.get('date');
    const startTime = searchParams.get('start');
    const endTime = searchParams.get('end');
    const location = searchParams.get('location');

    if (eventName && staffName && eventDate && startTime && endTime && location) {
      setAssignment({
        id: '',
        eventName,
        staffName,
        eventDate,
        startTime,
        endTime,
        location
      });
    }
  }, [searchParams]);

  // Check status on load
  useEffect(() => {
    if (token) {
      checkCurrentStatus();
    } else {
      setError("No confirmation token provided");
      setInitialLoading(false);
    }
  }, [token]);

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading assignment details...</p>
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
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'already_confirmed' || status === 'confirmed') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-green-700 dark:text-green-400">Assignment Confirmed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {assignment && (
              <>
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">{assignment.eventName}</h3>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      {formatDate(assignment.eventDate)}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      {formatTime12Hour(assignment.startTime)} - {formatTime12Hour(assignment.endTime)}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      {assignment.location}
                    </div>
                  </div>
                </div>
                <Badge variant="default" className="w-full justify-center py-2">
                  ✓ Confirmed
                </Badge>
                {confirmationTimestamp && (
                  <div className="text-center text-xs text-muted-foreground">
                    Confirmed on: {formatTimestamp(confirmationTimestamp)}
                  </div>
                )}
                {icsContent && (
                  <Button
                    onClick={downloadICS}
                    className="w-full"
                    variant="outline"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Calendar Event
                  </Button>
                )}
              </>
            )}
            <p className="text-center text-sm text-muted-foreground">
              You have already confirmed this assignment. Thank you!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'already_declined' || status === 'declined') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-red-700 dark:text-red-400">Assignment Declined</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {assignment && (
              <>
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">{assignment.eventName}</h3>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      {formatDate(assignment.eventDate)}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      {formatTime12Hour(assignment.startTime)} - {formatTime12Hour(assignment.endTime)}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      {assignment.location}
                    </div>
                  </div>
                </div>
                <Badge variant="destructive" className="w-full justify-center py-2">
                  ✗ Declined
                </Badge>
                {confirmationTimestamp && (
                  <div className="text-center text-xs text-muted-foreground">
                    Declined on: {formatTimestamp(confirmationTimestamp)}
                  </div>
                )}
              </>
            )}
            <p className="text-center text-sm text-muted-foreground">
              You have declined this assignment.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-foreground">Event Assignment Confirmation</CardTitle>
          <p className="text-sm text-muted-foreground">
            Please confirm or decline your assignment for this event
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {assignment && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">{assignment.eventName}</h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    {formatDate(assignment.eventDate)}
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    {formatTime12Hour(assignment.startTime)} - {formatTime12Hour(assignment.endTime)}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    {assignment.location}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => handleConfirmation('confirm')}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Check className="w-4 h-4 mr-2" />
              {loading ? 'Processing...' : 'Confirm'}
            </Button>
            <Button
              onClick={() => handleConfirmation('decline')}
              disabled={loading}
              variant="destructive"
            >
              <X className="w-4 h-4 mr-2" />
              {loading ? 'Processing...' : 'Decline'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
