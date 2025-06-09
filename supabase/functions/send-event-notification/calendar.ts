
import { NotificationRequest } from "./types.ts";

export function generateICSContent(event: NotificationRequest): string {
  // Parse the date and times correctly for Philippine timezone
  const eventDateStr = event.eventDate; // Format: YYYY-MM-DD
  const startTimeStr = event.startTime; // Format: HH:MM (24-hour)
  const endTimeStr = event.endTime; // Format: HH:MM (24-hour)
  
  // Create date strings in the format the ICS expects (local time in Manila timezone)
  const startDateTime = `${eventDateStr}T${startTimeStr}:00`;
  const endDateTime = `${eventDateStr}T${endTimeStr}:00`;
  
  // Format for ICS in local time (YYYYMMDDTHHMMSS)
  const formatDateForICS = (dateTimeStr: string) => {
    return dateTimeStr.replace(/[-:]/g, '').replace('T', 'T');
  };
  
  const startFormatted = formatDateForICS(startDateTime);
  const endFormatted = formatDateForICS(endDateTime);
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  const organizerInfo = event.organizer ? `\\nOrganizer: ${event.organizer}` : '';
  
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Event Management System//Event Notification//EN
BEGIN:VTIMEZONE
TZID:Asia/Manila
BEGIN:STANDARD
DTSTART:19701101T000000
TZOFFSETFROM:+0800
TZOFFSETTO:+0800
TZNAME:PST
END:STANDARD
END:VTIMEZONE
BEGIN:VEVENT
UID:${event.eventId}@admin-ccsdocu.com
DTSTAMP:${now}
DTSTART;TZID=Asia/Manila:${startFormatted}
DTEND;TZID=Asia/Manila:${endFormatted}
SUMMARY:${event.eventName}
DESCRIPTION:${event.isUpdate ? 'Event details have been updated.' : 'You have been assigned to this event.'} Event: ${event.eventName}${organizerInfo}
LOCATION:${event.location}
STATUS:CONFIRMED
BEGIN:VALARM
TRIGGER:-PT360M
ACTION:DISPLAY
DESCRIPTION:Event reminder (6 hours): ${event.eventName}
END:VALARM
BEGIN:VALARM
TRIGGER:-PT60M
ACTION:DISPLAY
DESCRIPTION:Event reminder (1 hour): ${event.eventName}
END:VALARM
END:VEVENT
END:VCALENDAR`;
}
