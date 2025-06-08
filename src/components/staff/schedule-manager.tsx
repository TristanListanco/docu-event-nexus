
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Clock, Plus, Edit, Trash2 } from "lucide-react";
import { SubjectSchedule, Schedule } from "@/types/models";

interface ScheduleManagerProps {
  subjectSchedules: SubjectSchedule[];
  onSubjectSchedulesChange: (schedules: SubjectSchedule[]) => void;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  days: number[];
}

export default function ScheduleManager({ subjectSchedules, onSubjectSchedulesChange }: ScheduleManagerProps) {
  const [currentSubject, setCurrentSubject] = useState("");
  const [currentTimeSlots, setCurrentTimeSlots] = useState<TimeSlot[]>([]);
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayNamesLong = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const addTimeSlot = () => {
    setCurrentTimeSlots([...currentTimeSlots, {
      startTime: "09:00",
      endTime: "11:00",
      days: []
    }]);
  };

  const updateTimeSlot = (index: number, field: keyof TimeSlot, value: any) => {
    const updated = [...currentTimeSlots];
    updated[index] = { ...updated[index], [field]: value };
    setCurrentTimeSlots(updated);
  };

  const removeTimeSlot = (index: number) => {
    setCurrentTimeSlots(currentTimeSlots.filter((_, i) => i !== index));
  };

  const toggleDay = (timeSlotIndex: number, day: number) => {
    const updated = [...currentTimeSlots];
    const days = updated[timeSlotIndex].days;
    if (days.includes(day)) {
      updated[timeSlotIndex].days = days.filter(d => d !== day);
    } else {
      updated[timeSlotIndex].days = [...days, day];
    }
    setCurrentTimeSlots(updated);
  };

  const saveSubjectSchedule = () => {
    if (!currentSubject.trim() || currentTimeSlots.length === 0) return;

    const schedules: Schedule[] = [];
    currentTimeSlots.forEach((timeSlot) => {
      timeSlot.days.forEach((day) => {
        schedules.push({
          id: editingSubjectId ? `existing-${Date.now()}-${Math.random()}` : `temp-${Date.now()}-${Math.random()}`,
          dayOfWeek: day,
          startTime: timeSlot.startTime,
          endTime: timeSlot.endTime,
          subjectScheduleId: editingSubjectId || `temp-subject-${Date.now()}`
        });
      });
    });

    const newSubjectSchedule: SubjectSchedule = {
      id: editingSubjectId || `temp-subject-${Date.now()}`,
      subject: currentSubject,
      schedules
    };

    if (editingSubjectId) {
      const updated = subjectSchedules.map(ss => 
        ss.id === editingSubjectId ? newSubjectSchedule : ss
      );
      onSubjectSchedulesChange(updated);
    } else {
      onSubjectSchedulesChange([...subjectSchedules, newSubjectSchedule]);
    }

    // Reset form
    setCurrentSubject("");
    setCurrentTimeSlots([]);
    setEditingSubjectId(null);
  };

  const editSubjectSchedule = (subjectSchedule: SubjectSchedule) => {
    setCurrentSubject(subjectSchedule.subject);
    setEditingSubjectId(subjectSchedule.id);

    // Group schedules by time slots
    const timeSlotMap = new Map<string, number[]>();
    subjectSchedule.schedules.forEach(schedule => {
      const key = `${schedule.startTime}-${schedule.endTime}`;
      if (!timeSlotMap.has(key)) {
        timeSlotMap.set(key, []);
      }
      timeSlotMap.get(key)!.push(schedule.dayOfWeek);
    });

    const timeSlots: TimeSlot[] = Array.from(timeSlotMap.entries()).map(([timeKey, days]) => {
      const [startTime, endTime] = timeKey.split('-');
      return { startTime, endTime, days };
    });

    setCurrentTimeSlots(timeSlots);
  };

  const deleteSubjectSchedule = (id: string) => {
    onSubjectSchedulesChange(subjectSchedules.filter(ss => ss.id !== id));
  };

  const cancelEdit = () => {
    setCurrentSubject("");
    setCurrentTimeSlots([]);
    setEditingSubjectId(null);
  };

  return (
    <div className="space-y-4">
      {/* Display existing subject schedules */}
      {subjectSchedules.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Current Schedules</h4>
          {subjectSchedules.map((subjectSchedule) => (
            <Card key={subjectSchedule.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h5 className="font-medium">{subjectSchedule.subject}</h5>
                  <div className="text-xs text-muted-foreground mt-1 space-y-1">
                    {Array.from(new Set(subjectSchedule.schedules.map(s => `${s.startTime}-${s.endTime}`))).map((timeSlot) => {
                      const [startTime, endTime] = timeSlot.split('-');
                      const daysForTimeSlot = subjectSchedule.schedules
                        .filter(s => s.startTime === startTime && s.endTime === endTime)
                        .map(s => s.dayOfWeek)
                        .sort((a, b) => a - b);
                      
                      return (
                        <div key={timeSlot}>
                          <span className="font-medium">{startTime} - {endTime}</span>
                          <span className="ml-2">
                            {daysForTimeSlot.map(day => dayNames[day]).join(', ')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => editSubjectSchedule(subjectSchedule)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => deleteSubjectSchedule(subjectSchedule.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            {editingSubjectId ? "Edit Schedule" : "Add New Schedule"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="subject" className="text-sm">Subject</Label>
            <Input
              id="subject"
              value={currentSubject}
              onChange={(e) => setCurrentSubject(e.target.value)}
              placeholder="e.g. MAT101"
              className="mt-1"
            />
          </div>

          {/* Time slots */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Time Slots</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTimeSlot}
              >
                <Plus className="h-3 w-3 mr-1" /> Add Time Slot
              </Button>
            </div>

            {currentTimeSlots.map((timeSlot, index) => (
              <Card key={index} className="p-3 bg-muted/50">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-2 flex-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <Input
                        type="time"
                        value={timeSlot.startTime}
                        onChange={(e) => updateTimeSlot(index, 'startTime', e.target.value)}
                        className="w-24"
                      />
                      <span className="text-muted-foreground text-sm">to</span>
                      <Input
                        type="time"
                        value={timeSlot.endTime}
                        onChange={(e) => updateTimeSlot(index, 'endTime', e.target.value)}
                        className="w-24"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTimeSlot(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Days</Label>
                    <div className="grid grid-cols-7 gap-1 mt-1">
                      {dayNamesLong.map((day, dayIndex) => (
                        <div key={day} className="flex items-center space-x-1">
                          <Checkbox
                            id={`${index}-${dayIndex}`}
                            checked={timeSlot.days.includes(dayIndex)}
                            onCheckedChange={() => toggleDay(index, dayIndex)}
                          />
                          <Label 
                            htmlFor={`${index}-${dayIndex}`} 
                            className="text-xs cursor-pointer"
                          >
                            {dayNames[dayIndex]}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="flex justify-end space-x-2">
            {editingSubjectId && (
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
              onClick={saveSubjectSchedule}
              disabled={!currentSubject.trim() || currentTimeSlots.length === 0 || currentTimeSlots.some(ts => ts.days.length === 0)}
            >
              {editingSubjectId ? "Update Schedule" : "Add Schedule"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
