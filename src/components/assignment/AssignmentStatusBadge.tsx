
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle } from "lucide-react";

interface AssignmentStatusBadgeProps {
  status: string;
}

export function AssignmentStatusBadge({ status }: AssignmentStatusBadgeProps) {
  switch (status) {
    case 'confirmed':
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Confirmed
        </Badge>
      );
    case 'declined':
      return (
        <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          <XCircle className="h-3 w-3 mr-1" />
          Declined
        </Badge>
      );
    default:
      return <Badge variant="secondary">Pending</Badge>;
  }
}
