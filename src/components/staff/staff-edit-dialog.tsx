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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StaffRole, StaffMember, LeaveDate, SubjectSchedule, StaffPosition } from "@/types/models";
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
  const { updateStaff } = useStaff();
  
  const [formData, setFormData] = useState({
    name: staff.name,
    role: (staff.roles?.find(r => r === "Photographer" || r === "Videographer") || "") as StaffRole | "",
    email: staff.email || "",
    position: staff.position || undefined as StaffPosition | undefined,
  });
  
  const [leaveDates, setLeaveDates] = useState<LeaveDate[]>([]);
  const [subjectSchedules, setSubjectSchedules] = useState<SubjectSchedule[]>([]);
  const [emailError, setEmailError] = useState("");

  useEffect(() => {
    if (open && staff) {
      console.log('Staff data from props:', staff);
      
      const primaryRole = staff.roles?.find(r => r === "Photographer" || r === "Videographer") || "";
      
      setFormData({
        name: staff.name,
        role: primaryRole as StaffRole | "",
        email: staff.email || "",
        position: staff.position || undefined,
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
      setEmailError("");
    }
  }, [staff, open]);

  const validateEmail = (email: string) => {
    if (!email) {
      setEmailError("");
      return true;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    
    setEmailError("");
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (name === "email") {
      validateEmail(value);
    }
  };

  const handleRoleChange = (role: StaffRole) => {
    setFormData((prev) => ({ ...prev, role }));
  };

  const handlePositionChange = (position: string) => {
    setFormData((prev) => ({ ...prev, position: position as StaffPosition }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.email && !validateEmail(formData.email)) {
      return; // Don't submit if email is invalid
    }
    
    setLoading(true);
    
    try {
      console.log('Submitting leave dates:', leaveDates);
      console.log('Submitting subject schedules:', subjectSchedules);
      
      const roles: StaffRole[] = [];
      if (formData.role) {
        roles.push(formData.role);
      }
      // Keep Working Com if it was originally there
      if (staff.roles?.includes("Working Com")) {
        roles.push("Working Com");
      }
      
      const success = await updateStaff(staff.id, {
        name: formData.name,
        roles: roles,
        email: formData.email || undefined,
        leaveDates: leaveDates,
        subjectSchedules: subjectSchedules,
        position: formData.position
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
              <div className="col-span-3">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full ${emailError ? "border-red-500" : ""}`}
                  placeholder="Optional"
                />
                {emailError && (
                  <p className="text-sm text-red-500 mt-1">{emailError}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                Role
              </Label>
              <div className="col-span-3">
                <RadioGroup value={formData.role} onValueChange={handleRoleChange}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Photographer" id="photographer" />
                    <Label htmlFor="photographer">Photographer</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Videographer" id="videographer" />
                    <Label htmlFor="videographer">Videographer</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                Position
              </Label>
              <div className="col-span-3">
                <Select value={formData.position} onValueChange={handlePositionChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select position (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Chairperson">Chairperson</SelectItem>
                    <SelectItem value="Co-Chairperson">Co-Chairperson</SelectItem>
                    <SelectItem value="Secretary">Secretary</SelectItem>
                    <SelectItem value="Undersecretary">Undersecretary</SelectItem>
                    <SelectItem value="Associate">Associate</SelectItem>
                    <SelectItem value="Working Com">Working Com</SelectItem>
                  </SelectContent>
                </Select>
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
            <Button 
              type="submit" 
              disabled={loading || !formData.role || !!emailError}
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
