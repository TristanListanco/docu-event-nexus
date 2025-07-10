
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StaffRole, SubjectSchedule, StaffPosition } from "@/types/models";
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
    role: "" as StaffRole | "",
    position: undefined as StaffPosition | undefined,
    workingCom: false,
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

  const handleRoleChange = (role: StaffRole) => {
    setFormData((prev) => ({ ...prev, role }));
  };

  const handlePositionChange = (position: string) => {
    setFormData((prev) => ({ ...prev, position: position as StaffPosition }));
  };

  const handleWorkingComChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, workingCom: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.role) {
      return; // Require a role
    }
    
    if (formData.email && !validateEmail(formData.email)) {
      return; // Don't submit if email is invalid
    }
    
    setLoading(true);
    
    try {
      const roles: StaffRole[] = [formData.role];
      if (formData.workingCom) {
        roles.push("Working Com");
      }

      const success = await addStaff({
        name: formData.name,
        roles: roles,
        email: formData.email || undefined,
        schedules: [],
        subjectSchedules: subjectSchedules,
        leaveDates: [],
        position: formData.position
      });
      
      if (success) {
        // Reset form
        setFormData({
          name: "",
          email: "",
          role: "",
          position: undefined,
          workingCom: false
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
              disabled={loading || !formData.role || !!emailError}
            >
              {loading ? "Adding..." : "Add Staff"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
