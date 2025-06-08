
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { StaffRole, StaffMember, LeaveDate, SubjectSchedule } from "@/types/models";
import { useStaff } from "@/hooks/use-staff";
import LeaveDatesManager from "./leave-dates-manager";
import ScheduleManager from "./schedule-manager";

interface StaffEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: StaffMember;
  onStaffUpdated?: () => void;
}

export default function StaffEditDialog({ open, onOpenChange, staff, onStaffUpdated }: StaffEditDialogProps) {
  const [loading, setLoading] = useState(false);
  const { updateStaffMember } = useStaff();
  
  const [formData, setFormData] = useState({
    name: staff.name,
    roles: staff.roles || [],
    email: staff.email || "",
  });
  
  const [leaveDates, setLeaveDates] = useState<LeaveDate[]>([]);
  const [subjectSchedules, setSubjectSchedules] = useState<SubjectSchedule[]>([]);

  useEffect(() => {
    if (open && staff) {
      console.log('Staff data from props:', staff);
      
      setFormData({
        name: staff.name,
        roles: staff.roles || [],
        email: staff.email || "",
      });
      
      // Properly map leave dates ensuring they have the correct structure
      const mappedLeaveDates: LeaveDate[] = (staff.leaveDates || []).map(leave => ({
        id: leave.id || `temp-${Date.now()}-${Math.random()}`,
        startDate: leave.startDate,
        endDate: leave.endDate
      }));
      
      console.log('Mapped leave dates:', mappedLeaveDates);
      setLeaveDates(mappedLeaveDates);
      
      // Set subject schedules
      setSubjectSchedules(staff.subjectSchedules || []);
    }
  }, [staff, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (role: StaffRole, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      roles: checked 
        ? [...prev.roles, role]
        : prev.roles.filter(r => r !== role)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      console.log('Submitting leave dates:', leaveDates);
      console.log('Submitting subject schedules:', subjectSchedules);
      
      const success = await updateStaffMember(staff.id, {
        name: formData.name,
        roles: formData.roles,
        email: formData.email || undefined,
        leaveDates: leaveDates,
        subjectSchedules: subjectSchedules
      });
      
      if (success) {
        if (onStaffUpdated) {
          onStaffUpdated();
        }
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error updating staff:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Staff Member</DialogTitle>
          <DialogDescription>
            Edit the details for this staff member. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="col-span-3"
                placeholder="Optional"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                Roles
              </Label>
              <div className="col-span-3 space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="photographer"
                    checked={formData.roles.includes("Photographer")}
                    onCheckedChange={(checked) => handleRoleChange("Photographer", !!checked)}
                  />
                  <Label htmlFor="photographer">Photographer</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="videographer"
                    checked={formData.roles.includes("Videographer")}
                    onCheckedChange={(checked) => handleRoleChange("Videographer", !!checked)}
                  />
                  <Label htmlFor="videographer">Videographer</Label>
                </div>
              </div>
            </div>
            
            <div className="border-t pt-4 mt-2">
              <h3 className="font-medium mb-3">Leave Dates</h3>
              <LeaveDatesManager 
                leaveDates={leaveDates}
                onLeaveDatesChange={setLeaveDates}
              />
            </div>
            
            <div className="border-t pt-4 mt-2">
              <h3 className="font-medium mb-3">Class Schedule</h3>
              <ScheduleManager
                subjectSchedules={subjectSchedules}
                onSubjectSchedulesChange={setSubjectSchedules}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading || formData.roles.length === 0}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
