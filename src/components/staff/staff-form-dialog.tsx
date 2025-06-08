
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { StaffRole, SubjectSchedule } from "@/types/models";
import { useStaff } from "@/hooks/use-staff";
import ScheduleManager from "./schedule-manager";

interface StaffFormDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onStaffAdded?: () => void;
}

export default function StaffFormDialog({ open, onOpenChange, onStaffAdded }: StaffFormDialogProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { addStaff } = useStaff();
  
  // Use external open state if provided, otherwise use internal state
  const isOpen = open !== undefined ? open : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    roles: [] as StaffRole[],
  });
  
  const [subjectSchedules, setSubjectSchedules] = useState<SubjectSchedule[]>([]);
  const [emailError, setEmailError] = useState("");

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
    
    if (formData.roles.length === 0) {
      return; // Require at least one role
    }
    
    if (formData.email && !validateEmail(formData.email)) {
      return; // Don't submit if email is invalid
    }
    
    setLoading(true);
    
    try {
      const success = await addStaff({
        name: formData.name,
        roles: formData.roles,
        email: formData.email || undefined,
        schedules: [],
        subjectSchedules: subjectSchedules,
        leaveDates: []
      });
      
      if (success) {
        // Reset form
        setFormData({
          name: "",
          email: "",
          roles: []
        });
        setSubjectSchedules([]);
        setEmailError("");
        
        // Call the onStaffAdded callback which should refresh the list and close the dialog
        if (onStaffAdded) {
          await onStaffAdded();
        } else {
          setIsOpen(false);
        }
      }
    } catch (error) {
      console.error("Error adding staff:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {open === undefined && (
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Staff Member
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Staff Member</DialogTitle>
          <DialogDescription>
            Fill in the details for the new staff member. Click save when you're done.
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
                placeholder="John Doe"
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
                  placeholder="john.doe@example.com"
                />
                {emailError && (
                  <p className="text-sm text-red-500 mt-1">{emailError}</p>
                )}
              </div>
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
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="working-com"
                    checked={formData.roles.includes("Working Com")}
                    onCheckedChange={(checked) => handleRoleChange("Working Com", !!checked)}
                  />
                  <Label htmlFor="working-com">Working Com</Label>
                </div>
              </div>
            </div>
            
            {/* Schedule Section */}
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
              disabled={loading || formData.roles.length === 0 || !!emailError}
            >
              {loading ? "Adding..." : "Add Staff"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
