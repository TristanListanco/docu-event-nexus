
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SendInvitationButtonProps {
  eventId: string;
  staffMember: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  eventData: {
    name: string;
    date: string;
    startTime: string;
    endTime: string;
    location: string;
    type: string;
  };
}

export default function SendInvitationButton({ eventId, staffMember, eventData }: SendInvitationButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [lastSentTime, setLastSentTime] = useState<Date | null>(null);

  // Check if 24 hours have passed since last send
  const canSendInvitation = () => {
    if (!lastSentTime) return true;
    const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    return (Date.now() - lastSentTime.getTime()) >= twentyFourHours;
  };

  const handleSendInvitation = async () => {
    if (!canSendInvitation()) {
      setShowWarningDialog(true);
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await supabase.functions.invoke('send-event-notification', {
        body: {
          eventId: eventId,
          eventName: eventData.name,
          eventDate: eventData.date,
          startTime: eventData.startTime,
          endTime: eventData.endTime,
          location: eventData.location,
          type: eventData.type,
          assignedStaff: [staffMember]
        }
      });

      if (error) {
        throw error;
      }

      // Set the last sent time and disable button
      const now = new Date();
      setLastSentTime(now);
      setIsDisabled(true);
      
      // Store in localStorage for persistence
      localStorage.setItem(`last_invite_${eventId}_${staffMember.id}`, now.toISOString());

      // Re-enable button after 24 hours
      setTimeout(() => {
        setIsDisabled(false);
      }, 24 * 60 * 60 * 1000);

      toast({
        title: "Invitation Sent",
        description: `Event invitation has been sent to ${staffMember.name}`,
      });

    } catch (error: any) {
      console.error("Error sending invitation:", error);
      toast({
        title: "Error",
        description: "Failed to send invitation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Check localStorage on component mount for persisted cooldown
  useState(() => {
    const lastSentString = localStorage.getItem(`last_invite_${eventId}_${staffMember.id}`);
    if (lastSentString) {
      const lastSent = new Date(lastSentString);
      setLastSentTime(lastSent);
      
      if (!canSendInvitation()) {
        setIsDisabled(true);
        
        // Calculate remaining time and set timeout
        const twentyFourHours = 24 * 60 * 60 * 1000;
        const remainingTime = twentyFourHours - (Date.now() - lastSent.getTime());
        
        if (remainingTime > 0) {
          setTimeout(() => {
            setIsDisabled(false);
          }, remainingTime);
        } else {
          setIsDisabled(false);
        }
      }
    }
  });

  const getRemainingTime = () => {
    if (!lastSentTime) return "";
    
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const elapsed = Date.now() - lastSentTime.getTime();
    const remaining = twentyFourHours - elapsed;
    
    if (remaining <= 0) return "";
    
    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    
    return `${hours}h ${minutes}m remaining`;
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSendInvitation}
        disabled={isDisabled || isLoading}
        className="h-8 w-8 p-0"
        title={isDisabled ? `Cooldown active: ${getRemainingTime()}` : `Send invitation to ${staffMember.name}`}
      >
        <Send className="h-4 w-4" />
      </Button>

      <AlertDialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Invitation Cooldown Active</AlertDialogTitle>
            <AlertDialogDescription>
              You can only send one invitation per staff member every 24 hours. 
              Please wait {getRemainingTime()} before sending another invitation to {staffMember.name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Understood</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
