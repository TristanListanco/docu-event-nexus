
interface AssignmentStatusMessageProps {
  status: string;
  successMessage?: string;
}

export function AssignmentStatusMessage({ status, successMessage }: AssignmentStatusMessageProps) {
  const isAlreadyProcessed = status === 'confirmed' || status === 'declined';
  const isCancelled = status === 'cancelled';

  if (successMessage) {
    return (
      <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
        <p className="text-green-800 dark:text-green-200 text-center font-medium">
          {successMessage}
        </p>
      </div>
    );
  }

  if (isCancelled) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-red-800 dark:text-red-200 text-center font-medium">
          This event has been cancelled. We apologize for any inconvenience.
        </p>
      </div>
    );
  }

  if (isAlreadyProcessed) {
    return (
      <div className={`p-4 rounded-lg border ${
        status === 'confirmed' 
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
          : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
      }`}>
        <p className={`text-center font-medium ${
          status === 'confirmed' 
            ? 'text-green-800 dark:text-green-200' 
            : 'text-red-800 dark:text-red-200'
        }`}>
          You have already {status} your attendance for this event.
        </p>
      </div>
    );
  }

  return null;
}
