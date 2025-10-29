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
}

export async function fetchStaffAttendanceData(
  staff: StaffMember[]
): Promise<AttendanceData[]> {
  const attendanceData: AttendanceData[] = [];

  for (const member of staff) {
    const { data, error } = await supabase
      .from("staff_assignments")
      .select("attendance_status")
      .eq("staff_id", member.id);

    if (error) {
      console.error(`Error fetching attendance for ${member.name}:`, error);
      attendanceData.push({
        staffId: member.id,
        staffName: member.name,
        completed: 0,
        absent: 0,
        excused: 0,
      });
    } else {
      const completed = data?.filter((a) => a.attendance_status === "Completed").length || 0;
      const absent = data?.filter((a) => a.attendance_status === "Absent").length || 0;
      const excused = data?.filter((a) => a.attendance_status === "Excused").length || 0;

      attendanceData.push({
        staffId: member.id,
        staffName: member.name,
        completed,
        absent,
        excused,
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

  // Add header
  doc.setFontSize(20);
  doc.text("Staff Attendance Report", 14, 20);

  doc.setFontSize(10);
  doc.text(`Document ID: ${documentId}`, 14, 28);
  doc.text(`Generated: ${currentDate}`, 14, 34);

  // Prepare table data
  const tableData = attendanceData.map((data) => [
    data.staffName,
    data.completed.toString(),
    data.excused.toString(),
    data.absent.toString(),
  ]);

  // Add table
  autoTable(doc, {
    startY: 42,
    head: [["Staff Name", "Present", "Excused", "Absent"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [59, 130, 246], // Blue color
      textColor: 255,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 10,
      cellPadding: 5,
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
  });

  // Save the PDF
  doc.save(`attendance-report-${new Date().getTime()}.pdf`);
}
