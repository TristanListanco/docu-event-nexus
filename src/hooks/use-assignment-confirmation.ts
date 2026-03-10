
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

  const generateICSContent = (eventData: AssignmentData): string => {
    const eventDateStr = eventData.eventDate.includes('T') 
      ? eventData.eventDate.split('T')[0] 
      : eventData.eventDate;
    
    const formatDateForICS = (dateStr: string, time: string) => {
      return `${dateStr}T${time}:00`.replace(/[-:]/g, '').replace('T', 'T');
    };
    
    const escapeICSText = (text: string) => {
      return text.replace(/\\/g, '\\\\')
                 .replace(/;/g, '\\;')
                 .replace(/,/g, '\\,')
                 .replace(/\n/g, '\\n');
    };
    
    const startFormatted = formatDateForICS(eventDateStr, eventData.startTime);
    const endFormatted = formatDateForICS(eventDateStr, eventData.endTime);
    const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    const organizerInfo = eventData.organizer ? `\\nOrganizer: ${escapeICSText(eventData.organizer)}` : '';
    const escapedEventName = escapeICSText(eventData.eventName);
    const escapedLocation = escapeICSText(eventData.location);
    
    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Event Management System//Event Notification//EN
BEGIN:VTIMEZONE
TZID:Asia/Manila
BEGIN:STANDARD
DTSTART:19701101T000000
TZOFFSETFROM:+0800
TZOFFSETTO:+0800
TZNAME:PST
END:STANDARD
END:VTIMEZONE
BEGIN:VEVENT
UID:${eventData.id}@admin-ccsdocu.com
DTSTAMP:${now}
DTSTART;TZID=Asia/Manila:${startFormatted}
DTEND;TZID=Asia/Manila:${endFormatted}
SUMMARY:${escapedEventName}
DESCRIPTION:Event: ${escapedEventName}${organizerInfo}
LOCATION:${escapedLocation}
STATUS:CONFIRMED
BEGIN:VALARM
TRIGGER:-PT360M
ACTION:DISPLAY
DESCRIPTION:Event reminder (6 hours): ${escapedEventName}
END:VALARM
BEGIN:VALARM
TRIGGER:-PT60M
ACTION:DISPLAY
DESCRIPTION:Event reminder (1 hour): ${escapedEventName}
END:VALARM
END:VEVENT
END:VCALENDAR`;
  };

  const downloadCalendarEvent = async () => {
    if (!assignment) return;

    try {
      console.log("Generating calendar event client-side for:", assignment);
      
      const icsContent = generateICSContent(assignment);

      const blob = new Blob([icsContent], { type: 'text/calendar; charset=utf-8' });
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
