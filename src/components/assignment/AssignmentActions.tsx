
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Download } from "lucide-react";

interface AssignmentActionsProps {
  status: string;
  confirming: boolean;
  onConfirm: () => void;
  onDecline: () => void;
  onDownloadCalendar: () => void;
}

export function AssignmentActions({ 
  status, 
  confirming, 
  onConfirm, 
  onDecline, 
  onDownloadCalendar 
}: AssignmentActionsProps) {
  const isAlreadyProcessed = status === 'confirmed' || status === 'declined';
  const isCancelled = status === 'cancelled';

  // Don't show any actions for cancelled events
  if (isCancelled) {
    return null;
  }

  if (!isAlreadyProcessed) {
    return (
      <div className="flex gap-4 pt-4">
        <Button
          onClick={onConfirm}
          disabled={confirming}
          className="flex-1"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          {confirming ? 'Processing...' : 'Confirm Attendance'}
        </Button>
        <Button
          onClick={onDecline}
          disabled={confirming}
          variant="destructive"
          className="flex-1"
        >
          <XCircle className="h-4 w-4 mr-2" />
          {confirming ? 'Processing...' : 'Decline'}
        </Button>
      </div>
    );
  }

  if (status === 'confirmed') {
    return (
      <div className="flex justify-center pt-4">
        <Button 
          onClick={onDownloadCalendar}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Download Calendar Event
        </Button>
      </div>
    );
  }

  return null;
}
