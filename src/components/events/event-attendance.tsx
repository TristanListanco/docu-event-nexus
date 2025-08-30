
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AttendanceStatus } from "@/types/models";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface StaffAttendanceProps {
  staffId: string;
  eventId: string;
  initialAttendanceStatus: AttendanceStatus;
}

export function StaffAttendance({ staffId, eventId, initialAttendanceStatus }: StaffAttendanceProps) {
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus>(initialAttendanceStatus);
  const queryClient = useQueryClient();

  const updateAttendanceMutation = useMutation({
    mutationFn: async (newStatus: AttendanceStatus) => {
      const { error } = await supabase
        .from('staff_assignments')
        .update({ attendance_status: newStatus })
        .eq('staff_id', staffId)
        .eq('event_id', eventId);

      if (error) throw error;
      return newStatus;
    },
    onSuccess: (newStatus) => {
      setAttendanceStatus(newStatus);
      toast({
        title: "Success",
        description: "Attendance status updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update attendance status.",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Absent":
        return "bg-red-100 text-red-800";
      case "Excused":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select
        value={attendanceStatus}
        onValueChange={(value: AttendanceStatus) => updateAttendanceMutation.mutate(value)}
      >
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Pending">Pending</SelectItem>
          <SelectItem value="Completed">Completed</SelectItem>
          <SelectItem value="Absent">Absent</SelectItem>
          <SelectItem value="Excused">Excused</SelectItem>
        </SelectContent>
      </Select>
      <Badge className={getStatusColor(attendanceStatus)}>
        {attendanceStatus}
      </Badge>
    </div>
  );
}
