
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "../use-auth";
import { Event, EventStatus, EventType, AttendanceStatus } from "@/types/models";
import { toast } from "../use-toast";
import { generateLogId } from "./event-log-generator";
import { fetchStaffAssignmentsWithRoles } from "./staff-assignment-mapper";
import { sendEventNotifications } from "./event-notifications";
import { insertStaffAssignments, updateStaffAssignments } from "./event-staff-operations";

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadEvents = async () => {
    setLoading(true);
    try {
      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      // We need to fetch staff assignments separately with confirmation status
      const events: Event[] = await Promise.all(
        data.map(async (event) => {
          const { videographerAssignments, photographerAssignments } = await fetchStaffAssignmentsWithRoles(event.id);

          return {
            id: event.id,
            logId: event.log_id,
            name: event.name,
            date: event.date,
            startTime: event.start_time,
            endTime: event.end_time,
            location: event.location,
            organizer: event.organizer,
            type: event.type as EventType,
            status: event.status as EventStatus,
            videographers: videographerAssignments,
            photographers: photographerAssignments,
            ignoreScheduleConflicts: event.ignore_schedule_conflicts,
            ccsOnlyEvent: event.ccs_only_event || false,
            isBigEvent: event.is_big_event,
            bigEventId: event.big_event_id
          };
        })
      );

      setEvents(events);
    } catch (error: any) {
      console.error("Error loading events:", error.message);
      toast({
        title: "Error loading events",
        description: error.message || "Could not load events. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addEvent = async (
    eventData: Omit<Event, "id" | "videographers" | "photographers">,
    videographerIds: string[],
    photographerIds: string[],
    sendEmailNotifications: boolean = true
  ) => {
    try {
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Generate log ID
      const logId = generateLogId(eventData.type);

      // Insert the event
      const { data: eventData_, error: eventError } = await supabase
        .from("events")
        .insert({
          name: eventData.name,
          log_id: logId,
          date: eventData.date,
          start_time: eventData.startTime,
          end_time: eventData.endTime,
          location: eventData.location,
          organizer: eventData.organizer,
          type: eventData.type,
          status: "Upcoming",
          ignore_schedule_conflicts: eventData.ignoreScheduleConflicts,
          ccs_only_event: eventData.ccsOnlyEvent || false,
          is_big_event: eventData.isBigEvent || false,
          big_event_id: eventData.bigEventId || null,
          user_id: user.id
        })
        .select()
        .single();

      if (eventError) {
        throw eventError;
      }

      const allAssignedStaffIds = [...videographerIds, ...photographerIds];
      
      await insertStaffAssignments(user.id, eventData_.id, videographerIds, photographerIds);

      // Send email notifications only if requested and there are assigned staff
      if (sendEmailNotifications && allAssignedStaffIds.length > 0) {
        await sendEventNotifications(
          {
            eventId: eventData_.id,
            eventName: eventData.name,
            eventDate: eventData.date,
            startTime: eventData.startTime,
            endTime: eventData.endTime,
            location: eventData.location,
            organizer: eventData.organizer,
            type: eventData.type
          },
          allAssignedStaffIds,
          videographerIds
        );
      } else {
        const message = sendEmailNotifications 
          ? `${eventData.name} has been successfully created.`
          : `${eventData.name} has been created without sending email notifications.`;
        
        toast({
          title: "Event Created",
          description: message,
        });
      }

      // Refresh the events list
      await loadEvents();

      return eventData_.id;
    } catch (error: any) {
      console.error("Error adding event:", error.message);
      toast({
        title: "Error Adding Event",
        description: error.message || "Could not add event. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      if (!user) {
        throw new Error("User not authenticated");
      }

      // First, delete all staff assignments for this event
      const { error: assignmentsError } = await supabase
        .from("staff_assignments")
        .delete()
        .eq("event_id", eventId);

      if (assignmentsError) {
        throw assignmentsError;
      }

      // Then delete the event
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId)
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      // Update the local state by removing the deleted event
      setEvents(events.filter((event) => event.id !== eventId));

      toast({
        title: "Event Deleted",
        description: "The event has been successfully deleted.",
      });

      return true;
    } catch (error: any) {
      console.error("Error deleting event:", error.message);
      toast({
        title: "Error Deleting Event",
        description: error.message || "Could not delete event. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const getEvent = async (eventId: string): Promise<Event | null> => {
    try {
      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .eq("user_id", user.id)
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        return null;
      }

      const { videographerAssignments, photographerAssignments } = await fetchStaffAssignmentsWithRoles(eventId);

      const event: Event = {
        id: data.id,
        logId: data.log_id,
        name: data.name,
        date: data.date,
        startTime: data.start_time,
        endTime: data.end_time,
        location: data.location,
        organizer: data.organizer,
        type: data.type as EventType,
        status: data.status as EventStatus,
        videographers: videographerAssignments,
        photographers: photographerAssignments,
        ignoreScheduleConflicts: data.ignore_schedule_conflicts,
        ccsOnlyEvent: data.ccs_only_event || false,
        isBigEvent: data.is_big_event,
        bigEventId: data.big_event_id
      };
      
      return event;
    } catch (error: any) {
      console.error("Error getting event:", error.message);
      toast({
        title: "Error Loading Event",
        description: error.message || "Could not load event details. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateEvent = async (
    eventId: string, 
    eventData: Partial<Omit<Event, "id" | "videographers" | "photographers">>,
    videographerIds?: string[],
    photographerIds?: string[]
  ) => {
    try {
      if (!user) {
        throw new Error("User not authenticated");
      }

      console.log("Updating event with staff assignments:", { videographerIds, photographerIds });

      // Get current event data to track changes
      const currentEvent = events.find(e => e.id === eventId);
      if (!currentEvent) {
        throw new Error("Event not found");
      }

      // Track changes for notifications
      const changes: any = {};
      if (eventData.name && eventData.name !== currentEvent.name) {
        changes.name = { old: currentEvent.name, new: eventData.name };
      }
      if (eventData.date && eventData.date !== currentEvent.date) {
        changes.date = { old: currentEvent.date, new: eventData.date };
      }
      if (eventData.startTime && eventData.startTime !== currentEvent.startTime) {
        changes.startTime = { old: currentEvent.startTime, new: eventData.startTime };
      }
      if (eventData.endTime && eventData.endTime !== currentEvent.endTime) {
        changes.endTime = { old: currentEvent.endTime, new: eventData.endTime };
      }
      if (eventData.location && eventData.location !== currentEvent.location) {
        changes.location = { old: currentEvent.location, new: eventData.location };
      }
      if (eventData.organizer && eventData.organizer !== currentEvent.organizer) {
        changes.organizer = { old: currentEvent.organizer, new: eventData.organizer };
      }
      if (eventData.type && eventData.type !== currentEvent.type) {
        changes.type = { old: currentEvent.type, new: eventData.type };
      }

      const hasChanges = Object.keys(changes).length > 0;

      // Update the event
      const updateData: any = {};
      if (eventData.name) updateData.name = eventData.name;
      if (eventData.logId) updateData.log_id = eventData.logId;
      if (eventData.date) updateData.date = eventData.date;
      if (eventData.startTime) updateData.start_time = eventData.startTime;
      if (eventData.endTime) updateData.end_time = eventData.endTime;
      if (eventData.location) updateData.location = eventData.location;
      if (eventData.organizer !== undefined) updateData.organizer = eventData.organizer;
      if (eventData.type) updateData.type = eventData.type;
      if (eventData.status) updateData.status = eventData.status;
      if (eventData.ignoreScheduleConflicts !== undefined) {
        updateData.ignore_schedule_conflicts = eventData.ignoreScheduleConflicts;
      }
      if (eventData.ccsOnlyEvent !== undefined) {
        updateData.ccs_only_event = eventData.ccsOnlyEvent;
      }
      if (eventData.isBigEvent !== undefined) {
        updateData.is_big_event = eventData.isBigEvent;
      }
      if (eventData.bigEventId) updateData.big_event_id = eventData.bigEventId;

      const { error } = await supabase
        .from("events")
        .update(updateData)
        .eq("id", eventId)
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      // Handle staff assignments - ensure unique IDs only
      const uniqueVideographerIds = videographerIds ? Array.from(new Set(videographerIds)) : undefined;
      const uniquePhotographerIds = photographerIds ? Array.from(new Set(photographerIds)) : undefined;
      
      await updateStaffAssignments(user.id, eventId, uniqueVideographerIds, uniquePhotographerIds);

      // Send update notifications if there are meaningful changes and assigned staff
      if (hasChanges) {
        const allAssignedIds = [
          ...(uniqueVideographerIds ? uniqueVideographerIds.filter(id => id && id !== "none") : 
             currentEvent.videographers?.map(v => v.staffId) || []),
          ...(uniquePhotographerIds ? uniquePhotographerIds.filter(id => id && id !== "none") : 
             currentEvent.photographers?.map(p => p.staffId) || [])
        ];

        if (allAssignedIds.length > 0) {
          const updatedEventData = {
            name: eventData.name || currentEvent.name,
            date: eventData.date || currentEvent.date,
            startTime: eventData.startTime || currentEvent.startTime,
            endTime: eventData.endTime || currentEvent.endTime,
            location: eventData.location || currentEvent.location,
            organizer: eventData.organizer || currentEvent.organizer,
            type: eventData.type || currentEvent.type
          };

          await sendEventNotifications(
            {
              eventId: eventId,
              eventName: updatedEventData.name,
              eventDate: updatedEventData.date,
              startTime: updatedEventData.startTime,
              endTime: updatedEventData.endTime,
              location: updatedEventData.location,
              organizer: updatedEventData.organizer,
              type: updatedEventData.type,
              isUpdate: true,
              changes: changes
            },
            allAssignedIds,
            uniqueVideographerIds ? uniqueVideographerIds.filter(id => id && id !== "none") : 
              currentEvent.videographers?.map(v => v.staffId) || [],
            true
          );
        } else {
          toast({
            title: "Event Updated",
            description: "The event has been successfully updated.",
          });
        }
      } else {
        toast({
          title: "Event Updated",
          description: "The event has been successfully updated.",
        });
      }

      // Refresh the events list
      await loadEvents();

      return true;
    } catch (error: any) {
      console.error("Error updating event:", error.message);
      toast({
        title: "Error Updating Event",
        description: error.message || "Could not update event. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Load events on initialization and when user changes
  useEffect(() => {
    if (user) {
      loadEvents();
    }
  }, [user]);

  return {
    events,
    loading,
    loadEvents,
    addEvent,
    deleteEvent,
    getEvent,
    updateEvent
  };
}
