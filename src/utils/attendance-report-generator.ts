import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { StaffMember } from "@/types/models";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";

interface EventAttendance {
  eventName: string;
  status: string;
  excuseReason?: string;
}

interface AttendanceData {
  staffId: string;
  staffName: string;
  completed: number;
  absent: number;
  excused: number;
  events: EventAttendance[];
}

export async function fetchStaffAttendanceData(
  staff: StaffMember[]
): Promise<AttendanceData[]> {
  const attendanceData: AttendanceData[] = [];

  for (const member of staff) {
    // Fetch attendance status and event details with date and status
    const { data, error } = await supabase
      .from("staff_assignments")
      .select(`
        attendance_status,
        event_id,
        events (
          name,
          date,
          end_time,
          status
        )
      `)
      .eq("staff_id", member.id);

    if (error) {
      console.error(`Error fetching attendance for ${member.name}:`, error);
      attendanceData.push({
        staffId: member.id,
        staffName: member.name,
        completed: 0,
        absent: 0,
        excused: 0,
        events: [],
      });
    } else {
      // Filter for completed/past events only
      const now = new Date();
      const filteredData = data?.filter((a: any) => {
        if (!a.events) return false;
        
        const eventDate = new Date(a.events.date.replace(/-/g, '/'));
        const eventEnd = new Date(`${a.events.date.replace(/-/g, '/')} ${a.events.end_time}`);
        
        // Only include if event has ended or is cancelled
        if (a.events.status === "Cancelled") return true;
        return eventEnd < now;
      }) || [];

      const completed = filteredData?.filter((a) => a.attendance_status === "Completed").length || 0;
      const absent = filteredData?.filter((a) => a.attendance_status === "Absent").length || 0;
      const excused = filteredData?.filter((a) => a.attendance_status === "Excused").length || 0;
      
      // Extract event names with their attendance status
      const eventAttendances: EventAttendance[] = filteredData
        ?.map((a: any) => {
          const status = a.events?.status === "Cancelled" 
            ? "Cancelled" 
            : a.attendance_status || "Pending";
          
          const excuseReason = status === "Excused" && a.excuse_reason ? a.excuse_reason : undefined;
          
          const event: EventAttendance = {
            eventName: a.events?.name || "Unknown Event",
            status
          };
          
          if (excuseReason) {
            event.excuseReason = excuseReason;
          }
          
          return event;
        })
        .filter((e) => !!e.eventName) || [];

      attendanceData.push({
        staffId: member.id,
        staffName: member.name,
        completed,
        absent,
        excused,
        events: eventAttendances,
      });
    }
  }

  return attendanceData;
}

export function generateAttendanceReportPDF(
  attendanceData: AttendanceData[]
): void {
  const doc = new jsPDF();
  const documentId = uuidv4();
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Theme colors from the website (primary teal: hsl(175, 84%, 32%))
  const primaryColor: [number, number, number] = [13, 148, 136]; // RGB equivalent of hsl(175, 84%, 32%)
  const accentColor: [number, number, number] = [46, 196, 182]; // RGB equivalent of hsl(175, 84%, 47%)
  
  let yPos = 20;
  
  // Organization header
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("Mindanao State University - Iligan Institute of Technology", 105, yPos, { align: "center" });
  
  yPos += 6;
  doc.setFontSize(11);
  doc.text("CCS Student Council", 105, yPos, { align: "center" });
  
  yPos += 6;
  doc.text("Multimedia Management", 105, yPos, { align: "center" });
  
  yPos += 6;
  doc.text("DOCUMENTATIONS COMMITTEE", 105, yPos, { align: "center" });
  
  yPos += 10;
  
  // Document title
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("CCS-SC MMM (DOCUMENTATION)", 105, yPos, { align: "center" });
  
  yPos += 6;
  doc.text("Attendance and Accomplishment Report", 105, yPos, { align: "center" });
  
  yPos += 10;
  
  // Document info
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`Document ID: ${documentId}`, 14, yPos);
  doc.text(`Generated: ${currentDate}`, 140, yPos);
  
  yPos += 8;

  // Create detailed table data with events and their status
  const tableData = attendanceData.map((member) => {
    const eventsText = member.events
      .map((e) => {
        let statusLabel = e.status === "Completed" ? "(Completed)" :
                         e.status === "Absent" ? "(Absent)" :
                         e.status === "Excused" ? "(Excused)" :
                         e.status === "Cancelled" ? "(Cancelled)" : "";
        
        // Add excuse reason if available
        if (e.status === "Excused" && e.excuseReason) {
          statusLabel += ` - ${e.excuseReason}`;
        }
        
        return `${e.eventName} ${statusLabel}`;
      })
      .join("\n");

    return [
      member.staffName,
      member.completed.toString(),
      member.excused.toString(),
      member.absent.toString(),
      eventsText || "No events assigned",
    ];
  });

  // Add table with color-coded attendance
  autoTable(doc, {
    startY: yPos,
    head: [["Staff Name", "Present", "Excused", "Absent", "Events / Assignments"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: primaryColor,
      textColor: 255,
      fontStyle: "bold",
      fontSize: 10,
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
    },
    alternateRowStyles: {
      fillColor: [245, 250, 249],
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 20, halign: "center" },
      2: { cellWidth: 20, halign: "center" },
      3: { cellWidth: 20, halign: "center" },
      4: { cellWidth: 95 },
    },
    didParseCell: (data) => {
      // Color code the events column based on status
      if (data.column.index === 4 && data.section === 'body') {
        const cellText = data.cell.text.join(' ');
        
        if (cellText.includes('(Completed)')) {
          data.cell.styles.textColor = [22, 163, 74]; // Green for completed
        } else if (cellText.includes('(Absent)')) {
          data.cell.styles.textColor = [220, 38, 38]; // Red for absent
        } else if (cellText.includes('(Excused)')) {
          data.cell.styles.textColor = [234, 179, 8]; // Yellow for excused
        } else if (cellText.includes('(Cancelled)')) {
          data.cell.styles.textColor = [107, 114, 128]; // Gray for cancelled
          data.cell.styles.fontStyle = 'italic';
        }
      }
    },
  });

  // Save the PDF
  doc.save(`CCS-SC-MMM-Attendance-Report-${new Date().getTime()}.pdf`);
}
