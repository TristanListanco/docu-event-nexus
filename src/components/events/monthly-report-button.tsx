
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Calendar, Loader2 } from "lucide-react";
import { Event } from "@/types/models";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { useStaff } from "@/hooks/use-staff";

interface MonthlyReportButtonProps {
  events: Event[];
  selectedMonth: Date;
}

export default function MonthlyReportButton({ events, selectedMonth }: MonthlyReportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { staff } = useStaff();

  const generateMonthlyReport = async () => {
    setIsGenerating(true);
    
    try {
      const monthStart = startOfMonth(selectedMonth);
      const monthEnd = endOfMonth(selectedMonth);
      
      // Filter events for the selected month
      const monthlyEvents = events.filter(event => {
        const eventDate = parseISO(event.date);
        return eventDate >= monthStart && eventDate <= monthEnd;
      });

      // Group events by type
      const eventsByType = monthlyEvents.reduce((acc, event) => {
        if (!acc[event.type]) {
          acc[event.type] = [];
        }
        acc[event.type].push(event);
        return acc;
      }, {} as Record<string, Event[]>);

      // Generate HTML content
      const htmlContent = generateReportHTML(selectedMonth, eventsByType, staff);
      
      // Create and download the file
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `monthly-accomplishment-report-${format(selectedMonth, 'yyyy-MM')}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateReportHTML = (month: Date, eventsByType: Record<string, Event[]>, staffList: any[]) => {
    const monthName = format(month, 'MMMM yyyy');
    const totalEvents = Object.values(eventsByType).flat().length;
    
    const getStaffName = (staffId: string) => {
      const staffMember = staffList.find(s => s.id === staffId);
      return staffMember?.name || 'Unknown Staff';
    };

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Monthly Accomplishment Report - ${monthName}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
        }
        .header h1 {
            color: #1e40af;
            margin-bottom: 10px;
        }
        .summary {
            background-color: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            border-left: 4px solid #2563eb;
        }
        .event-type-section {
            margin-bottom: 30px;
        }
        .event-type-title {
            background-color: #2563eb;
            color: white;
            padding: 10px 15px;
            border-radius: 6px;
            margin-bottom: 15px;
            font-weight: bold;
        }
        .event-item {
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 15px;
            margin-bottom: 10px;
        }
        .event-title {
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 8px;
        }
        .event-details {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 10px;
        }
        .staff-assignments {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-top: 10px;
        }
        .staff-group {
            background-color: white;
            padding: 10px;
            border-radius: 4px;
            border: 1px solid #d1d5db;
        }
        .staff-group h4 {
            margin: 0 0 8px 0;
            color: #374151;
            font-size: 14px;
        }
        .staff-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .staff-list li {
            padding: 2px 0;
            font-size: 13px;
            color: #4b5563;
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            border-top: 2px solid #e5e7eb;
            padding-top: 20px;
            color: #6b7280;
            font-size: 14px;
        }
        .no-events {
            text-align: center;
            color: #6b7280;
            font-style: italic;
            padding: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Monthly Accomplishment Report</h1>
        <h2>${monthName}</h2>
        <p>Event Management System</p>
    </div>

    <div class="summary">
        <h3>Summary</h3>
        <p><strong>Total Events:</strong> ${totalEvents}</p>
        <p><strong>Report Generated:</strong> ${format(new Date(), 'MMMM dd, yyyy hh:mm a')}</p>
    </div>

    ${Object.keys(eventsByType).length === 0 ? 
      '<div class="no-events">No events recorded for this month.</div>' :
      Object.entries(eventsByType).map(([type, events]) => `
        <div class="event-type-section">
            <div class="event-type-title">${type} Events (${events.length})</div>
            ${events.map(event => `
                <div class="event-item">
                    <div class="event-title">${event.name}</div>
                    <div class="event-details">
                        <strong>Date:</strong> ${format(parseISO(event.date), 'MMMM dd, yyyy')} | 
                        <strong>Time:</strong> ${event.startTime} - ${event.endTime} | 
                        <strong>Location:</strong> ${event.location}
                        ${event.organizer ? ` | <strong>Organizer:</strong> ${event.organizer}` : ''}
                    </div>
                    <div class="staff-assignments">
                        <div class="staff-group">
                            <h4>📹 Videographers</h4>
                            <ul class="staff-list">
                                ${event.videographers && event.videographers.length > 0 ? 
                                  event.videographers.map(v => `<li>• ${getStaffName(v.staffId)}</li>`).join('') :
                                  '<li>• No videographer assigned</li>'}
                            </ul>
                        </div>
                        <div class="staff-group">
                            <h4>📷 Photographers</h4>
                            <ul class="staff-list">
                                ${event.photographers && event.photographers.length > 0 ? 
                                  event.photographers.map(p => `<li>• ${getStaffName(p.staffId)}</li>`).join('') :
                                  '<li>• No photographer assigned</li>'}
                            </ul>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
      `).join('')
    }

    <div class="footer">
        <p>This report was automatically generated by the Event Management System</p>
        <p>Generated on ${format(new Date(), 'MMMM dd, yyyy')} at ${format(new Date(), 'hh:mm a')}</p>
    </div>
</body>
</html>`;
  };

  return (
    <Button
      onClick={generateMonthlyReport}
      disabled={isGenerating}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {isGenerating ? 'Generating...' : 'Download Report'}
    </Button>
  );
}
