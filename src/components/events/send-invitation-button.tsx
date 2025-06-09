
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
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

  const handleSendInvitation = async () => {
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

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleSendInvitation}
      disabled={isLoading}
      className="h-8 w-8 p-0"
      title={`Send invitation to ${staffMember.name}`}
    >
      <Send className="h-4 w-4" />
    </Button>
  );
}
