
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send, Check, AlertCircle, Clock } from "lucide-react";
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
  lastSentAt?: string | null;
  onInvitationSent?: () => void;
}

export default function SendInvitationButton({ 
  eventId, 
  staffMember, 
  eventData, 
  lastSentAt,
  onInvitationSent 
}: SendInvitationButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [sendStatus, setSendStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const canSendEmail = () => {
    if (!lastSentAt) return true;
    const timeSinceLastSend = Date.now() - new Date(lastSentAt).getTime();
    return timeSinceLastSend > 30000; // 30 seconds cooldown
  };

  const handleSendInvitation = async () => {
    if (isLoading || !canSendEmail()) {
      if (!canSendEmail()) {
        const remainingTime = Math.ceil((30000 - (Date.now() - new Date(lastSentAt!).getTime())) / 1000);
        toast({
          title: "Please Wait",
          description: `You can resend the invitation in ${remainingTime} seconds.`,
          variant: "default",
        });
      }
      return;
    }

    setIsLoading(true);
    setSendStatus('sending');
    
    // Show immediate feedback
    toast({
      title: "Sending Invitation",
      description: `Sending invitation to ${staffMember.name}...`,
    });
    
    try {
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

      // Update the invitation timestamp immediately for better UX
      const now = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('staff_assignments')
        .update({ 
          manual_invitation_sent_at: now,
          last_invitation_sent_at: now
        })
        .eq('event_id', eventId)
        .eq('staff_id', staffMember.id);

      if (updateError) {
        console.error("Error updating invitation timestamp:", updateError);
      }

      setSendStatus('success');
      toast({
        title: "Invitation Sent",
        description: `Event invitation has been sent to ${staffMember.name}`,
      });

      if (onInvitationSent) {
        onInvitationSent();
      }

      // Reset success status after 2 seconds (faster feedback)
      setTimeout(() => setSendStatus('idle'), 2000);

    } catch (error: any) {
      console.error("Error sending invitation:", error);
      setSendStatus('error');
      
      let errorMessage = "Failed to send invitation. Please try again.";
      if (error.message?.includes("Rate limit exceeded")) {
        errorMessage = "Please wait before sending another invitation.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });

      // Reset error status after 2 seconds
      setTimeout(() => setSendStatus('idle'), 2000);
    } finally {
      setIsLoading(false);
    }
  };

  const getIcon = () => {
    if (sendStatus === 'sending') return <Clock className="h-4 w-4 animate-spin" />;
    if (sendStatus === 'success') return <Check className="h-4 w-4 text-green-600" />;
    if (sendStatus === 'error') return <AlertCircle className="h-4 w-4 text-red-600" />;
    return <Send className="h-4 w-4" />;
  };

  const getButtonVariant = () => {
    if (sendStatus === 'success') return 'outline';
    if (sendStatus === 'error') return 'outline';
    return 'ghost';
  };

  const isDisabled = isLoading || !canSendEmail() || sendStatus === 'sending';

  return (
    <Button
      variant={getButtonVariant()}
      size="sm"
      onClick={handleSendInvitation}
      disabled={isDisabled}
      className="h-8 w-8 p-0"
      title={
        !canSendEmail() 
          ? `Please wait ${Math.ceil((30000 - (Date.now() - new Date(lastSentAt!).getTime())) / 1000)}s before resending`
          : sendStatus === 'sending'
          ? `Sending invitation to ${staffMember.name}...`
          : `Send invitation to ${staffMember.name}`
      }
    >
      {getIcon()}
    </Button>
  );
}
