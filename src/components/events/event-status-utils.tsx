
export const getEventStatus = (event: { date: string; startTime: string; endTime: string }) => {
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
