import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { StaffMember } from "@/types/models";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";

interface AttendanceData {
  staffId: string;
  staffName: string;
  completed: number;
  absent: number;
  excused: number;
  events: string[];
}

export async function fetchStaffAttendanceData(
  staff: StaffMember[]
): Promise<AttendanceData[]> {
  const attendanceData: AttendanceData[] = [];

  for (const member of staff) {
    // Fetch attendance status and event details
    const { data, error } = await supabase
      .from("staff_assignments")
      .select(`
        attendance_status,
        event_id,
        events (
          name
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
      const completed = data?.filter((a) => a.attendance_status === "Completed").length || 0;
      const absent = data?.filter((a) => a.attendance_status === "Absent").length || 0;
      const excused = data?.filter((a) => a.attendance_status === "Excused").length || 0;
      
      // Extract unique event names
      const eventNames = [...new Set(
        data
          ?.map((a: any) => a.events?.name)
          .filter((name): name is string => !!name) || []
      )];

      attendanceData.push({
        staffId: member.id,
        staffName: member.name,
        completed,
        absent,
        excused,
        events: eventNames,
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

  // Create detailed table data with events
  const tableData = attendanceData.map((data) => {
    const eventsText = data.events.length > 0 
      ? data.events.join(", ") 
      : "No events assigned";
    
    return [
      data.staffName,
      data.completed.toString(),
      data.excused.toString(),
      data.absent.toString(),
      eventsText,
    ];
  });

  // Add table
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
  });

  // Save the PDF
  doc.save(`CCS-SC-MMM-Attendance-Report-${new Date().getTime()}.pdf`);
}
