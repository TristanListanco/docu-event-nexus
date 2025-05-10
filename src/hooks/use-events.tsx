
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Event, EventType, EventStatus, EventAssignment } from "@/types/models";

export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  const loadEvents = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          staff_assignments(*)
        `)
        .eq('user_id', user.id)
        .order('date', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      // Map database results to Event type
      const mappedEvents: Event[] = data.map(event => {
        // Process staff assignments
        let videographers: EventAssignment[] = [];
        let photographers: EventAssignment[] = [];
        
        if (event.staff_assignments && event.staff_assignments.length > 0) {
          // Get all staff assignments for this event
          const staffAssignments = event.staff_assignments;
          
          // Process videographer assignments
          const videoAssignments = staffAssignments.filter((assignment: any) => 
            assignment.role === 'Videographer'
          );
          
          // Process photographer assignments
          const photoAssignments = staffAssignments.filter((assignment: any) => 
            assignment.role === 'Photographer'
          );
          
          videographers = videoAssignments.map((assignment: any) => ({
            staffId: assignment.staff_id,
            status: assignment.attendance_status
          }));
          
          photographers = photoAssignments.map((assignment: any) => ({
            staffId: assignment.staff_id,
            status: assignment.attendance_status
          }));
        }
        
        return {
          id: event.id,
          logId: event.log_id,
          name: event.name,
          date: event.date,
          startTime: event.start_time,
          endTime: event.end_time,
          location: event.location,
          type: event.type as EventType,
          status: event.status as EventStatus,
          videographers,
          photographers,
          ignoreScheduleConflicts: event.ignore_schedule_conflicts,
          isBigEvent: event.is_big_event,
          bigEventId: event.big_event_id || undefined
        };
      });
      
      setEvents(mappedEvents);
    } catch (error: any) {
      console.error("Error loading events:", error);
      toast({
        title: "Failed to load events",
        description: error.message || "An error occurred while loading events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const createEvent = async (eventData: Omit<Event, "id" | "logId" | "videographers" | "photographers"> & {
    videographers?: string[];
    photographers?: string[];
  }) => {
    if (!user) return null;
    
    try {
      setLoading(true);
      
      // Generate a log ID
      const logId = `EV-${new Date().getFullYear()}-${String(events.length + 1).padStart(3, '0')}`;
      
      const { data, error } = await supabase
        .from('events')
        .insert({
          user_id: user.id,
          name: eventData.name,
          log_id: logId,
          date: eventData.date,
          start_time: eventData.startTime,
          end_time: eventData.endTime,
          location: eventData.location,
          type: eventData.type,
          status: eventData.status || 'Upcoming',
          ignore_schedule_conflicts: eventData.ignoreScheduleConflicts || false,
          is_big_event: eventData.isBigEvent || false,
          big_event_id: eventData.bigEventId || null
        })
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      // Add staff assignments if provided
      if (eventData.videographers && eventData.videographers.length > 0) {
        const videographerAssignments = eventData.videographers.map(staffId => ({
          user_id: user.id,
          event_id: data.id,
          staff_id: staffId,
          role: 'Videographer',
          attendance_status: 'Pending'
        }));
        
        const { error: assignError } = await supabase
          .from('staff_assignments')
          .insert(videographerAssignments);
          
        if (assignError) {
          console.error("Error assigning videographers:", assignError);
        }
      }
      
      if (eventData.photographers && eventData.photographers.length > 0) {
        const photographerAssignments = eventData.photographers.map(staffId => ({
          user_id: user.id,
          event_id: data.id,
          staff_id: staffId,
          role: 'Photographer',
          attendance_status: 'Pending'
        }));
        
        const { error: assignError } = await supabase
          .from('staff_assignments')
          .insert(photographerAssignments);
          
        if (assignError) {
          console.error("Error assigning photographers:", assignError);
        }
      }
      
      const newEvent: Event = {
        id: data.id,
        logId: data.log_id,
        name: data.name,
        date: data.date,
        startTime: data.start_time,
        endTime: data.end_time,
        location: data.location,
        type: data.type as EventType,
        status: data.status as EventStatus,
        videographers: [],
        photographers: [],
        ignoreScheduleConflicts: data.ignore_schedule_conflicts,
        isBigEvent: data.is_big_event,
        bigEventId: data.big_event_id || undefined
      };
      
      // Update the local state and reload events to ensure everything is fresh
      await loadEvents();
      
      toast({
        title: "Event Created",
        description: `${eventData.name} has been successfully created.`,
      });
      
      return newEvent;
    } catch (error: any) {
      console.error("Error creating event:", error);
      toast({
        title: "Failed to create event",
        description: error.message || "An error occurred while creating the event",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  const updateEvent = async (eventId: string, eventData: Partial<Event>) => {
    if (!user) return false;
    
    try {
      setLoading(true);
      
      // Convert to database format
      const dbEventData: any = {
        name: eventData.name,
        date: eventData.date,
        start_time: eventData.startTime,
        end_time: eventData.endTime,
        location: eventData.location,
        type: eventData.type,
        status: eventData.status,
        ignore_schedule_conflicts: eventData.ignoreScheduleConflicts,
        is_big_event: eventData.isBigEvent,
        big_event_id: eventData.bigEventId || null
      };
      
      // Remove undefined properties
      Object.keys(dbEventData).forEach(key => 
        dbEventData[key] === undefined && delete dbEventData[key]
      );
      
      const { error } = await supabase
        .from('events')
        .update(dbEventData)
        .eq('id', eventId)
        .eq('user_id', user.id);
        
      if (error) {
        throw error;
      }
      
      // Update staff assignments if provided
      if (eventData.videographers !== undefined || eventData.photographers !== undefined) {
        // First delete all existing assignments for this event
        const { error: deleteError } = await supabase
          .from('staff_assignments')
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', user.id);
          
        if (deleteError) {
          throw deleteError;
        }
        
        const assignments = [];
        
        // Add videographer assignments
        if (eventData.videographers && eventData.videographers.length > 0) {
          eventData.videographers.forEach(assignment => {
            assignments.push({
              user_id: user.id,
              event_id: eventId,
              staff_id: assignment.staffId,
              role: 'Videographer',
              attendance_status: assignment.status || 'Pending'
            });
          });
        }
        
        // Add photographer assignments
        if (eventData.photographers && eventData.photographers.length > 0) {
          eventData.photographers.forEach(assignment => {
            assignments.push({
              user_id: user.id,
              event_id: eventId,
              staff_id: assignment.staffId,
              role: 'Photographer',
              attendance_status: assignment.status || 'Pending'
            });
          });
        }
        
        // Insert new assignments if any
        if (assignments.length > 0) {
          const { error: insertError } = await supabase
            .from('staff_assignments')
            .insert(assignments);
            
          if (insertError) {
            throw insertError;
          }
        }
      }
      
      // Reload events instead of updating local state to ensure everything is fresh
      await loadEvents();
      
      toast({
        title: "Event Updated",
        description: "The event has been successfully updated.",
      });
      
      return true;
    } catch (error: any) {
      console.error("Error updating event:", error);
      toast({
        title: "Failed to update event",
        description: error.message || "An error occurred while updating the event",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  const deleteEvent = async (eventId: string) => {
    if (!user) return false;
    
    try {
      setLoading(true);
      
      // First delete all staff assignments for this event
      const { error: assignmentsError } = await supabase
        .from('staff_assignments')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user.id);
        
      if (assignmentsError) {
        throw assignmentsError;
      }
      
      // Then delete the event
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)
        .eq('user_id', user.id);
        
      if (error) {
        throw error;
      }
      
      // Update local state
      await loadEvents();
      
      toast({
        title: "Event Deleted",
        description: "The event has been successfully deleted.",
      });
      
      return true;
    } catch (error: any) {
      console.error("Error deleting event:", error);
      toast({
        title: "Failed to delete event",
        description: error.message || "An error occurred while deleting the event",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Load events on component mount and when user changes
  useEffect(() => {
    if (user) {
      loadEvents();
    } else {
      setEvents([]);
    }
  }, [user]);
  
  return { events, loading, loadEvents, createEvent, updateEvent, deleteEvent };
};
