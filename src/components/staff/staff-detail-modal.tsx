
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, MapPin, Calendar, CheckCircle, XCircle, Clock } from "lucide-react";
import { StaffMember } from "@/types/models";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

interface AttendanceStats {
  completed: number;
  absent: number;
  excused: number;
}

interface StaffDetailModalProps {
  staff: StaffMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function StaffDetailModal({ staff, open, onOpenChange }: StaffDetailModalProps) {
  const { user } = useAuth();
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({
    completed: 0,
    absent: 0,
    excused: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (staff && user && open) {
      loadAttendanceStats();
    }
  }, [staff, user, open]);

  const loadAttendanceStats = async () => {
    if (!staff || !user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('staff_assignments')
        .select('attendance_status')
        .eq('staff_id', staff.id)
        .eq('user_id', user.id);

      if (error) throw error;

      const stats = {
        completed: data?.filter(a => a.attendance_status === 'Completed').length || 0,
        absent: data?.filter(a => a.attendance_status === 'Absent').length || 0,
        excused: data?.filter(a => a.attendance_status === 'Excused').length || 0
      };

      setAttendanceStats(stats);
    } catch (error) {
      console.error("Error loading attendance stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!staff) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Staff Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Basic Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{staff.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{staff.position || "No position assigned"}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {staff.roles.map(role => (
                  <Badge key={role} variant="secondary" className="text-xs">
                    {role}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Attendance Statistics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4" />
                Attendance Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4 text-muted-foreground">Loading...</div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                    <div className="text-2xl font-bold text-green-600">{attendanceStats.completed}</div>
                    <div className="text-xs text-muted-foreground">Present</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <XCircle className="h-8 w-8 text-red-500" />
                    </div>
                    <div className="text-2xl font-bold text-red-600">{attendanceStats.absent}</div>
                    <div className="text-xs text-muted-foreground">Absent</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Clock className="h-8 w-8 text-gray-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-600">{attendanceStats.excused}</div>
                    <div className="text-xs text-muted-foreground">Excused</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
