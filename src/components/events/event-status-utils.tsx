
import { Event } from "@/types/models";

export const getEventStatus = (event: Event) => {
  // If event has explicit status (like Cancelled), use it
  if (event.status && event.status !== "Upcoming") {
    return event.status;
  }

  // Calculate dynamic status based on time
  const now = new Date();
  const eventDate = new Date(event.date);
  const eventStart = new Date(`${event.date}T${event.startTime}`);
  const eventEnd = new Date(`${event.date}T${event.endTime}`);

  if (now < eventStart) {
    return "Upcoming";
  } else if (now >= eventStart && now <= eventEnd) {
    return "On Going";
  } else {
    return "Elapsed";
  }
};
