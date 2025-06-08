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
import { X, Clock, Plus, Edit } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StaffRole, Schedule, StaffMember, LeaveDate } from "@/types/models";
import { useStaff } from "@/hooks/use-staff";
import LeaveDatesManager from "./leave-dates-manager";

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
    role: staff.role,
    email: staff.email || "",
  });
  
  const [schedules, setSchedules] = useState<Omit<Schedule, "id">[]>([]);
  const [leaveDates, setLeaveDates] = useState<LeaveDate[]>([]);
  const [currentSchedule, setCurrentSchedule] = useState({
    dayOfWeek: 1,
    startTime: "09:00",
    endTime: "11:00",
    subject: ""
  });

  const [editingScheduleIndex, setEditingScheduleIndex] = useState<number | null>(null);
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);

  useEffect(() => {
    setFormData({
      name: staff.name,
      role: staff.role,
      email: staff.email || "",
    });
    
    setSchedules(staff.schedules.map(schedule => ({
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      subject: schedule.subject
    })));
    
    setLeaveDates(staff.leaveDates || []);
  }, [staff, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({ ...prev, role: value as StaffRole }));
  };
  
  const handleScheduleChange = (field: keyof typeof currentSchedule, value: string | number) => {
    setCurrentSchedule(prev => ({ ...prev, [field]: value }));
  };
  
  const handleDayChange = (value: string) => {
    setCurrentSchedule(prev => ({ ...prev, dayOfWeek: parseInt(value) }));
  };
  
  const addSchedule = () => {
    if (!currentSchedule.subject.trim()) {
      return;
    }
    
    if (isEditingSchedule && editingScheduleIndex !== null) {
      const updatedSchedules = [...schedules];
      updatedSchedules[editingScheduleIndex] = { ...currentSchedule };
      setSchedules(updatedSchedules);
      setIsEditingSchedule(false);
      setEditingScheduleIndex(null);
    } else {
      setSchedules([...schedules, { ...currentSchedule }]);
    }
    
    setCurrentSchedule({
      dayOfWeek: currentSchedule.dayOfWeek,
      startTime: "09:00",
      endTime: "11:00",
      subject: ""
    });
  };
  
  const editSchedule = (index: number) => {
    const scheduleToEdit = schedules[index];
    setCurrentSchedule({
      dayOfWeek: scheduleToEdit.dayOfWeek,
      startTime: scheduleToEdit.startTime,
      endTime: scheduleToEdit.endTime,
      subject: scheduleToEdit.subject
    });
    setEditingScheduleIndex(index);
    setIsEditingSchedule(true);
  };
  
  const cancelEdit = () => {
    setCurrentSchedule({
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "11:00",
      subject: ""
    });
    setIsEditingSchedule(false);
    setEditingScheduleIndex(null);
  };
  
  const removeSchedule = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index));
    
    if (isEditingSchedule && editingScheduleIndex === index) {
      cancelEdit();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const staffSchedules = staff.schedules || [];
      const currentIds = staffSchedules.map(s => s.id);
      const schedulesToUpdate: { toAdd: Omit<Schedule, "id">[]; toUpdate: Schedule[]; toDelete: string[]; } = {
        toAdd: schedules.filter(s => !('id' in s)),
        toUpdate: [],
        toDelete: currentIds.filter(id => !schedules.some(s => 'id' in s && s.id === id))
      };
      
      const success = await updateStaffMember(staff.id, {
        name: formData.name,
        role: formData.role,
        email: formData.email || undefined,
        schedules: schedulesToUpdate,
        leaveDates: leaveDates
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
  
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
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
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <Select 
                value={formData.role}
                onValueChange={handleRoleChange}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Photographer">Photographer</SelectItem>
                  <SelectItem value="Videographer">Videographer</SelectItem>
                </SelectContent>
              </Select>
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
              
              {schedules.length > 0 && (
                <div className="mb-4 space-y-2">
                  {schedules.map((schedule, index) => (
                    <div key={index} className="flex items-center justify-between bg-muted p-2 rounded-md">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{schedule.subject}</p>
                        <p className="text-xs text-muted-foreground">
                          {dayNames[schedule.dayOfWeek]} • {schedule.startTime} - {schedule.endTime}
                        </p>
                      </div>
                      <div className="flex space-x-1">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => editSchedule(index)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeSchedule(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="space-y-3">
                <div className="grid grid-cols-4 items-center gap-2">
                  <Label htmlFor="day" className="text-right text-sm">
                    Day
                  </Label>
                  <Select 
                    value={currentSchedule.dayOfWeek.toString()} 
                    onValueChange={handleDayChange}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dayNames.map((day, index) => (
                        <SelectItem key={day} value={index.toString()}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-2">
                  <Label htmlFor="subject" className="text-right text-sm">
                    Subject
                  </Label>
                  <Input
                    id="subject"
                    value={currentSchedule.subject}
                    onChange={(e) => handleScheduleChange('subject', e.target.value)}
                    className="col-span-3"
                    placeholder="e.g. MAT101"
                  />
                </div>
                
                <div className="grid grid-cols-4 gap-2">
                  <Label className="text-right text-sm pt-2">
                    Time
                  </Label>
                  <div className="col-span-3 flex items-center space-x-2">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                      <Input
                        type="time"
                        value={currentSchedule.startTime}
                        onChange={(e) => handleScheduleChange('startTime', e.target.value)}
                        className="w-24"
                      />
                    </div>
                    <span className="text-muted-foreground">to</span>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                      <Input
                        type="time"
                        value={currentSchedule.endTime}
                        onChange={(e) => handleScheduleChange('endTime', e.target.value)}
                        className="w-24"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  {isEditingSchedule && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={cancelEdit}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSchedule}
                    disabled={!currentSchedule.subject.trim()}
                  >
                    <Plus className="h-3 w-3 mr-1" /> 
                    {isEditingSchedule ? "Update Schedule" : "Add Schedule"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
