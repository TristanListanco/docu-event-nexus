import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";

interface StaffHeaderProps {
  onAddStaff: () => void;
  onGenerateReport: () => void;
  totalStaff: number;
}

export default function StaffHeader({ onAddStaff, onGenerateReport, totalStaff }: StaffHeaderProps) {
  return (
    <div className="border-b">
      <div className="flex items-center justify-between p-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Staff Members ({totalStaff})</h1>
        </div>
        <div className="flex space-x-2">
          <Button onClick={onGenerateReport} variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
          <Button onClick={onAddStaff} size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
