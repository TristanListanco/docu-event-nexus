
import { Event } from "@/types/models";

export const getEventStatus = (event: Event) => {
  // If event has explicit status (like Cancelled), use it
  if (event.status === "Cancelled") {
    return "Cancelled";
  }

  // Calculate dynamic status based on time for other statuses
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

export const getStatusColor = (status: string) => {
  switch (status) {
    case "Upcoming":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "On Going":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "Elapsed":
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    case "Cancelled":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
  }
};
