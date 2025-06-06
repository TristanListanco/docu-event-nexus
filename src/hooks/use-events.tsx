import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { Event, EventStatus, EventType, StaffAssignment, AttendanceStatus } from "@/types/models";
import { toast } from "./use-toast";
import { format } from "date-fns";

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const generateLogId = (eventType: EventType): string => {
    // Create ID in format "CCSEVNT-TYPE-MONTH-DAY-YEAR"
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(now.getDate()).padStart(2, '0');
    const year = now.getFullYear();
    
    // Get type code
    let typeCode;
    switch(eventType) {
      case "General": typeCode = "01"; break;
      case "SPECOM": typeCode = "02"; break;
      case "LITCOM": typeCode = "03"; break;
      case "CUACOM": typeCode = "04"; break;
      case "SPODACOM": typeCode = "05"; break;
      default: typeCode = "01"; // Default to General
    }
    
    return `CCSEVNT-${typeCode}-${month}-${day}-${year}`;
  };

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

      // We need to fetch staff assignments separately and filter by role
      const events: Event[] = await Promise.all(
        data.map(async (event) => {
          // Query for all staff assignments for this event
          const { data: allAssignments, error: assignmentsError } = await supabase
            .from("staff_assignments")
            .select(`
              staff_id, 
              attendance_status,
              staff_members!inner(role)
            `)
            .eq("event_id", event.id);

          if (assignmentsError) {
            console.error("Error fetching staff assignments:", assignmentsError);
          }

          // Filter assignments by role
          const videographerAssignments = allAssignments?.filter(a => 
            a.staff_members?.role === "Videographer"
          ) || [];
          
          const photographerAssignments = allAssignments?.filter(a => 
            a.staff_members?.role === "Photographer"
          ) || [];

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
            videographers: videographerAssignments.map(v => ({ 
              staffId: v.staff_id,
              attendanceStatus: v.attendance_status as AttendanceStatus
            })),
            photographers: photographerAssignments.map(p => ({ 
              staffId: p.staff_id,
              attendanceStatus: p.attendance_status as AttendanceStatus
            })),
            ignoreScheduleConflicts: event.ignore_schedule_conflicts,
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
    photographerIds: string[]
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
          type: eventData.type,
          status: "Upcoming",
          ignore_schedule_conflicts: eventData.ignoreScheduleConflicts,
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
      
      // Insert staff assignments for videographers
      if (videographerIds.length > 0) {
        const videographerAssignments = videographerIds.map(staffId => ({
          user_id: user.id,
          event_id: eventData_.id,
          staff_id: staffId,
          attendance_status: "Pending" as AttendanceStatus
        }));

        const { error: videographerError } = await supabase
          .from("staff_assignments")
          .insert(videographerAssignments);

        if (videographerError) {
          throw videographerError;
        }
      }

      // Insert staff assignments for photographers
      if (photographerIds.length > 0) {
        const photographerAssignments = photographerIds.map(staffId => ({
          user_id: user.id,
          event_id: eventData_.id,
          staff_id: staffId,
          attendance_status: "Pending" as AttendanceStatus
        }));

        const { error: photographerError } = await supabase
          .from("staff_assignments")
          .insert(photographerAssignments);

        if (photographerError) {
          throw photographerError;
        }
      }

      // If there are assigned staff, send email notifications
      if (allAssignedStaffIds.length > 0) {
        try {
          // Get staff details for email notifications
          const { data: staffData, error: staffError } = await supabase
            .from("staff_members")
            .select("id, name, email, role")
            .in("id", allAssignedStaffIds);

          if (staffError) {
            console.error("Error fetching staff for notifications:", staffError);
          } else if (staffData && staffData.length > 0) {
            // Send notification emails
            const { error: notificationError } = await supabase.functions.invoke('send-event-notification', {
              body: {
                eventId: eventData_.id,
                eventName: eventData.name,
                eventDate: eventData.date,
                startTime: eventData.startTime,
                endTime: eventData.endTime,
                location: eventData.location,
                type: eventData.type,
                assignedStaff: staffData.map(staff => ({
                  id: staff.id,
                  name: staff.name,
                  email: staff.email,
                  role: staff.role
                }))
              }
            });

            if (notificationError) {
              console.error("Error sending notifications:", notificationError);
              // Don't throw here - event creation was successful, just notification failed
              toast({
                title: "Event Created",
                description: `${eventData.name} has been created, but email notifications failed to send.`,
                variant: "default",
              });
            } else {
              toast({
                title: "Event Created",
                description: `${eventData.name} has been created and email notifications sent to assigned staff.`,
              });
            }
          }
        } catch (notificationError) {
          console.error("Error with notifications:", notificationError);
          toast({
            title: "Event Created",
            description: `${eventData.name} has been created, but email notifications failed to send.`,
            variant: "default",
          });
        }
      } else {
        toast({
          title: "Event Created",
          description: `${eventData.name} has been successfully created.`,
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

      // Fetch staff assignments with role information
      const { data: allAssignments, error: assignmentsError } = await supabase
        .from("staff_assignments")
        .select(`
          staff_id, 
          attendance_status,
          staff_members!inner(role)
        `)
        .eq("event_id", eventId);

      if (assignmentsError) {
        console.error("Error fetching staff assignments:", assignmentsError);
      }

      // Filter assignments by role
      const videographerAssignments = allAssignments?.filter(a => 
        a.staff_members?.role === "Videographer"
      ) || [];
      
      const photographerAssignments = allAssignments?.filter(a => 
        a.staff_members?.role === "Photographer"
      ) || [];

      const event: Event = {
        id: data.id,
        logId: data.log_id,
        name: data.name,
        date: data.date,
        startTime: data.start_time,
        endTime: data.end_time,
        location: data.location,
        type: data.type as EventType,
        status: data.status as EventStatus,
        videographers: videographerAssignments.map(v => ({ 
          staffId: v.staff_id,
          attendanceStatus: v.attendance_status as AttendanceStatus
        })),
        photographers: photographerAssignments.map(p => ({ 
          staffId: p.staff_id,
          attendanceStatus: p.attendance_status as AttendanceStatus
        })),
        ignoreScheduleConflicts: data.ignore_schedule_conflicts,
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

      // Update the event
      const updateData: any = {};
      if (eventData.name) updateData.name = eventData.name;
      if (eventData.logId) updateData.log_id = eventData.logId;
      if (eventData.date) updateData.date = eventData.date;
      if (eventData.startTime) updateData.start_time = eventData.startTime;
      if (eventData.endTime) updateData.end_time = eventData.endTime;
      if (eventData.location) updateData.location = eventData.location;
      if (eventData.type) updateData.type = eventData.type;
      if (eventData.status) updateData.status = eventData.status;
      if (eventData.ignoreScheduleConflicts !== undefined) {
        updateData.ignore_schedule_conflicts = eventData.ignoreScheduleConflicts;
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

      // If staff assignments were provided
      if (videographerIds || photographerIds) {
        // Delete existing staff assignments
        const { error: deleteError } = await supabase
          .from("staff_assignments")
          .delete()
          .eq("event_id", eventId);

        if (deleteError) {
          throw deleteError;
        }

        // Add new videographer assignments
        if (videographerIds && videographerIds.length > 0) {
          // Filter out "none" value
          const validVideographers = videographerIds.filter(id => id !== "none");
          
          if (validVideographers.length > 0) {
            const videographerAssignments = validVideographers.map(staffId => ({
              user_id: user.id,
              event_id: eventId,
              staff_id: staffId,
              attendance_status: "Pending" as AttendanceStatus
            }));

            const { error: videographerError } = await supabase
              .from("staff_assignments")
              .insert(videographerAssignments);

            if (videographerError) {
              throw videographerError;
            }
          }
        }

        // Add new photographer assignments
        if (photographerIds && photographerIds.length > 0) {
          // Filter out "none" value
          const validPhotographers = photographerIds.filter(id => id !== "none");
          
          if (validPhotographers.length > 0) {
            const photographerAssignments = validPhotographers.map(staffId => ({
              user_id: user.id,
              event_id: eventId,
              staff_id: staffId,
              attendance_status: "Pending" as AttendanceStatus
            }));

            const { error: photographerError } = await supabase
              .from("staff_assignments")
              .insert(photographerAssignments);

            if (photographerError) {
              throw photographerError;
            }
          }
        }
      }

      // Refresh the events list
      await loadEvents();

      toast({
        title: "Event Updated",
        description: "The event has been successfully updated.",
      });

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
