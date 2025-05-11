
import React from 'react';
import { StaffMember, Schedule } from '@/types/models';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface StaffScheduleDisplayProps {
  staff: StaffMember;
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function StaffScheduleDisplay({ staff }: StaffScheduleDisplayProps) {
  // Group schedules by day of week
  const schedulesByDay = staff.schedules.reduce((acc, schedule) => {
    if (!acc[schedule.dayOfWeek]) {
      acc[schedule.dayOfWeek] = [];
    }
    acc[schedule.dayOfWeek].push(schedule);
    return acc;
  }, {} as Record<number, Schedule[]>);
  
  // Sort schedules by start time
  Object.keys(schedulesByDay).forEach(day => {
    const dayIndex = parseInt(day);
    schedulesByDay[dayIndex].sort((a, b) => {
      return a.startTime < b.startTime ? -1 : 1;
    });
  });

  // Count total schedules
  const totalSchedules = staff.schedules.length;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center">
        <h3 className="text-sm font-medium">Class Schedule</h3>
        <Badge variant="outline" className="ml-2">
          {totalSchedules} {totalSchedules === 1 ? 'class' : 'classes'}
        </Badge>
      </div>
      
      {totalSchedules > 0 ? (
        <Card>
          <CardContent className="p-3">
            <div className="space-y-2 text-sm">
              {Object.keys(schedulesByDay)
                .map(day => parseInt(day))
                .sort((a, b) => a - b)
                .map(dayIndex => (
                  <div key={dayIndex} className="border-b last:border-b-0 pb-2 last:pb-0">
                    <h4 className="font-medium text-xs text-muted-foreground mb-1">
                      {dayNames[dayIndex]}
                    </h4>
                    <div className="space-y-1">
                      {schedulesByDay[dayIndex].map(schedule => (
                        <div key={schedule.id} className="flex items-center justify-between">
                          <span className="text-xs">
                            {schedule.startTime} - {schedule.endTime}
                          </span>
                          <span className="text-xs font-medium">
                            {schedule.subject}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="text-xs text-muted-foreground">
          No class schedules
        </div>
      )}
    </div>
  );
}
