
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
import { Plus, X, Clock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StaffRole, Schedule } from "@/types/models";
import { useStaff } from "@/hooks/use-staff";

export default function StaffFormDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { createStaffMember } = useStaff();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "Photographer" as StaffRole,
  });
  
  const [schedules, setSchedules] = useState<Omit<Schedule, "id">[]>([]);
  const [currentSchedule, setCurrentSchedule] = useState({
    dayOfWeek: 1, // Monday
    startTime: "09:00",
    endTime: "11:00",
    subject: ""
  });

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
      return; // Require subject to be filled
    }
    
    setSchedules([...schedules, { ...currentSchedule }]);
    setCurrentSchedule({
      dayOfWeek: currentSchedule.dayOfWeek,
      startTime: "09:00",
      endTime: "11:00",
      subject: ""
    });
  };
  
  const removeSchedule = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await createStaffMember({
        name: formData.name,
        role: formData.role,
        schedules,
        email: formData.email || undefined
      });
      
      setOpen(false);
      setFormData({
        name: "",
        email: "",
        role: "Photographer"
      });
      setSchedules([]);
    } catch (error) {
      console.error("Error adding staff:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Staff Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
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
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="col-span-3"
                placeholder="john.doe@example.com"
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
            
            {/* Schedule Section */}
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
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeSchedule(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
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
                
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSchedule}
                    disabled={!currentSchedule.subject.trim()}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add Schedule
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Staff"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
