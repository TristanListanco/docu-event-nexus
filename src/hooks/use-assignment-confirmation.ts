
import { useState, useEffect } from "react";
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
  organizer?: string;
  type?: string;
}

interface UseAssignmentConfirmationProps {
  token: string | null;
}

export function useAssignmentConfirmation({ token }: UseAssignmentConfirmationProps) {
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [assignment, setAssignment] = useState<AssignmentData | null>(null);
  const [error, setError] = useState<string>("");
  const [confirmationTimestamp, setConfirmationTimestamp] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const checkAssignmentStatus = async () => {
    if (!token) {
      setError("No confirmation token provided");
      setLoading(false);
      return;
    }

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
        // Check if it's a cancelled event
        if (data.status === 'cancelled') {
          setStatus('cancelled');
        }
        return;
      }

      setStatus(data.status);
      setAssignment(data.assignment);
      
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

  const downloadCalendarEvent = async () => {
    if (!assignment) return;

    try {
      console.log("Downloading calendar for assignment:", assignment);
      
      const eventDate = assignment.eventDate.includes('T') 
        ? assignment.eventDate.split('T')[0] 
        : assignment.eventDate;
      
      const { data, error } = await supabase.functions.invoke('send-event-notification', {
        body: {
          eventId: assignment.id,
          eventName: assignment.eventName,
          eventDate: eventDate,
          startTime: assignment.startTime,
          endTime: assignment.endTime,
          location: assignment.location || '',
          organizer: assignment.organizer || '',
          type: assignment.type || 'General',
          assignedStaff: [],
          downloadOnly: true
        }
      });

      if (error) {
        console.error("Calendar download error:", error);
        throw new Error(error.message || "Failed to generate calendar file");
      }

      if (!data || typeof data !== 'string') {
        throw new Error("Invalid calendar data received");
      }

      console.log("Calendar data received, creating download...");

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

      if (data.success) {
        setStatus(data.status);
        setSuccessMessage(data.message || `Assignment ${confirmAction}ed successfully`);
        
        if (data.timestamp) {
          setConfirmationTimestamp(data.timestamp);
        }

        toast({
          title: `Assignment ${confirmAction === 'confirm' ? 'Confirmed' : 'Declined'}`,
          description: `You have ${confirmAction}ed your assignment for ${assignment?.eventName}`,
        });

        if (confirmAction === 'confirm') {
          setTimeout(() => {
            downloadCalendarEvent();
          }, 1000);
        }

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

  useEffect(() => {
    checkAssignmentStatus();
  }, [token]);

  return {
    loading,
    confirming,
    status,
    assignment,
    error,
    confirmationTimestamp,
    successMessage,
    handleConfirmation,
    downloadCalendarEvent,
    checkAssignmentStatus
  };
}
