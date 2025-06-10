
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send, Check, AlertCircle } from "lucide-react";
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
  const [lastSent, setLastSent] = useState<Date | null>(null);
  const [sendStatus, setSendStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const canSendEmail = () => {
    if (!lastSent) return true;
    const timeSinceLastSend = Date.now() - lastSent.getTime();
    return timeSinceLastSend > 30000; // 30 seconds cooldown
  };

  const handleSendInvitation = async () => {
    // Prevent multiple clicks while processing or during cooldown
    if (isLoading || !canSendEmail()) {
      if (!canSendEmail()) {
        const remainingTime = Math.ceil((30000 - (Date.now() - lastSent!.getTime())) / 1000);
        toast({
          title: "Please Wait",
          description: `You can resend the invitation in ${remainingTime} seconds.`,
          variant: "default",
        });
      }
      return;
    }

    setIsLoading(true);
    setSendStatus('idle');
    
    try {
      // Use the confirmation-email function for consistency
      const { error } = await supabase.functions.invoke('confirmation-email', {
        body: {
          eventId: eventId,
          staffId: staffMember.id,
          staffName: staffMember.name,
          staffEmail: staffMember.email,
          staffRole: staffMember.role,
          eventName: eventData.name,
          eventDate: eventData.date,
          startTime: eventData.startTime,
          endTime: eventData.endTime,
          location: eventData.location,
          type: eventData.type
        }
      });

      if (error) {
        throw error;
      }

      setLastSent(new Date());
      setSendStatus('success');
      toast({
        title: "Invitation Sent",
        description: `Event invitation has been sent to ${staffMember.name}`,
      });

      // Reset success status after 3 seconds
      setTimeout(() => setSendStatus('idle'), 3000);

    } catch (error: any) {
      console.error("Error sending invitation:", error);
      setSendStatus('error');
      toast({
        title: "Error",
        description: "Failed to send invitation. Please try again.",
        variant: "destructive",
      });

      // Reset error status after 3 seconds
      setTimeout(() => setSendStatus('idle'), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const getIcon = () => {
    if (isLoading) return <Send className="h-4 w-4 animate-pulse" />;
    if (sendStatus === 'success') return <Check className="h-4 w-4 text-green-600" />;
    if (sendStatus === 'error') return <AlertCircle className="h-4 w-4 text-red-600" />;
    return <Send className="h-4 w-4" />;
  };

  const getButtonVariant = () => {
    if (sendStatus === 'success') return 'outline';
    if (sendStatus === 'error') return 'outline';
    return 'ghost';
  };

  return (
    <Button
      variant={getButtonVariant()}
      size="sm"
      onClick={handleSendInvitation}
      disabled={isLoading || !canSendEmail()}
      className="h-8 w-8 p-0"
      title={
        !canSendEmail() 
          ? `Please wait ${Math.ceil((30000 - (Date.now() - lastSent!.getTime())) / 1000)}s before resending`
          : `Send invitation to ${staffMember.name}`
      }
    >
      {getIcon()}
    </Button>
  );
}
