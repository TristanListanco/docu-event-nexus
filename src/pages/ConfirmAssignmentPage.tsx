
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAssignmentConfirmation } from "@/hooks/use-assignment-confirmation";
import { AssignmentDetails } from "@/components/assignment/AssignmentDetails";
import { AssignmentStatusBadge } from "@/components/assignment/AssignmentStatusBadge";
import { AssignmentActions } from "@/components/assignment/AssignmentActions";
import { AssignmentStatusMessage } from "@/components/assignment/AssignmentStatusMessage";
import { LoadingCard } from "@/components/assignment/LoadingCard";
import { ErrorCard } from "@/components/assignment/ErrorCard";

export default function ConfirmAssignmentPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  
  const {
    loading,
    confirming,
    status,
    assignment,
    error,
    confirmationTimestamp,
    successMessage,
    handleConfirmation,
    downloadCalendarEvent
  } = useAssignmentConfirmation({ token });

  if (loading) {
    return <LoadingCard />;
  }

  if (error) {
    return <ErrorCard error={error} />;
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

  const isAlreadyProcessed = status === 'confirmed' || status === 'declined';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-center">
            {isAlreadyProcessed 
              ? `Event ${status === 'confirmed' ? 'Confirmed' : 'Declined'}`
              : "Event Assignment Confirmation"
            }
          </CardTitle>
          <div className="text-center">
            <AssignmentStatusBadge status={status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <AssignmentStatusMessage 
            status={status} 
            successMessage={successMessage} 
          />

          <AssignmentDetails 
            assignment={assignment}
            confirmationTimestamp={confirmationTimestamp}
            status={status}
          />

          <AssignmentActions
            status={status}
            confirming={confirming}
            onConfirm={() => handleConfirmation('confirm')}
            onDecline={() => handleConfirmation('decline')}
            onDownloadCalendar={downloadCalendarEvent}
          />
        </CardContent>
      </Card>
    </div>
  );
}
