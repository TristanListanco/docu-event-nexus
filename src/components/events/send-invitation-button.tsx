
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
  const [sendStatus, setSendStatus] = useState<'idle' | 'success' | 'error'>('idle');

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

      // Update the manual invitation timestamp
      await supabase
        .from('staff_assignments')
        .update({ 
          manual_invitation_sent_at: new Date().toISOString(),
          last_invitation_sent_at: new Date().toISOString()
        })
        .eq('event_id', eventId)
        .eq('staff_id', staffMember.id);

      setSendStatus('success');
      toast({
        title: "Invitation Sent",
        description: `Event invitation has been sent to ${staffMember.name}`,
      });

      // Call the callback to refresh data
      if (onInvitationSent) {
        onInvitationSent();
      }

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
    <div className="flex flex-col items-end gap-1">
      <Button
        variant={getButtonVariant()}
        size="sm"
        onClick={handleSendInvitation}
        disabled={isLoading || !canSendEmail()}
        className="h-8 w-8 p-0"
        title={
          !canSendEmail() 
            ? `Please wait ${Math.ceil((30000 - (Date.now() - new Date(lastSentAt!).getTime())) / 1000)}s before resending`
            : `Send invitation to ${staffMember.name}`
        }
      >
        {getIcon()}
      </Button>
      {lastSentAt && (
        <div className="text-xs text-muted-foreground text-right">
          Manually sent email on<br />
          {new Date(lastSentAt).toLocaleDateString()} {new Date(lastSentAt).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
