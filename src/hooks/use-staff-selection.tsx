import { useState } from 'react';
import { useStaff } from '@/hooks/use-staff';
import { StaffMember } from '@/types/models';

export const useStaffSelection = () => {
  const { staff, getAvailableStaff } = useStaff();
  const [ignoreScheduleConflicts, setIgnoreScheduleConflicts] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  
  const [selectedVideographers, setSelectedVideographers] = useState<string[]>([]);
  const [selectedPhotographers, setSelectedPhotographers] = useState<string[]>([]);

  // Get available staff based on current selections and ignore conflicts setting
  const getAvailableStaffMembers = () => {
    if (!selectedDate || !startTime || !endTime) {
      return {
        videographers: [],
        photographers: []
      };
    }
    
    if (ignoreScheduleConflicts) {
      // If ignoring conflicts, show all staff members
      const videographers = staff.filter(s => s.role === 'Videographer');
      const photographers = staff.filter(s => s.role === 'Photographer');
      return { videographers, photographers };
    }
    
    // Otherwise, get staff with no schedule conflicts
    return getAvailableStaff(selectedDate, startTime, endTime);
  };
  
  // Reset staff selections when availability changes
  const resetSelections = () => {
    setSelectedVideographers([]);
    setSelectedPhotographers([]);
  };

  const toggleStaffSelection = (staffId: string, role: 'videographer' | 'photographer') => {
    if (role === 'videographer') {
      setSelectedVideographers(prev => 
        prev.includes(staffId)
          ? prev.filter(id => id !== staffId)
          : [...prev, staffId]
      );
    } else {
      setSelectedPhotographers(prev => 
        prev.includes(staffId)
          ? prev.filter(id => id !== staffId)
          : [...prev, staffId]
      );
    }
  };
  
  return {
    ignoreScheduleConflicts,
    setIgnoreScheduleConflicts,
    selectedDate,
    setSelectedDate,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    getAvailableStaffMembers,
    selectedVideographers,
    selectedPhotographers,
    toggleStaffSelection,
    resetSelections,
  };
};
