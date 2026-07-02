import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Archive, Plus } from "lucide-react";
import { useAcademicYears } from "@/hooks/use-academic-years";
import ArchiveYearDialog from "./archive-year-dialog";
import NewYearDialog from "./new-year-dialog";
import NewTermDialog from "./new-term-dialog";

export default function YearSwitcher() {
  const { years, activeYear, activeTerm, selectYear, isReadOnly } = useAcademicYears();
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [newYearOpen, setNewYearOpen] = useState(false);
  const [newTermOpen, setNewTermOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={activeYear?.id ?? ""} onValueChange={selectYear}>
        <SelectTrigger className="w-[220px]">
          <SelectValue placeholder="Select academic year" />
        </SelectTrigger>
        <SelectContent>
          {years.map(y => (
            <SelectItem key={y.id} value={y.id}>
              {y.start_year} — {y.end_year} {y.is_archived ? "(archived)" : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {activeTerm && (
        <Badge variant="secondary" className="text-xs">{activeTerm.semester}</Badge>
      )}
      {isReadOnly && <Badge variant="outline" className="text-xs">View-only</Badge>}

      {!isReadOnly && activeYear && (
        <Button variant="outline" size="sm" onClick={() => setNewTermOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> New Term
        </Button>
      )}
      <Button variant="outline" size="sm" onClick={() => setNewYearOpen(true)}>
        <Plus className="h-4 w-4 mr-1" /> New Year
      </Button>
      {activeYear && !activeYear.is_archived && (
        <Button variant="ghost" size="sm" onClick={() => setArchiveOpen(true)}>
          <Archive className="h-4 w-4 mr-1" /> Archive Year
        </Button>
      )}

      <ArchiveYearDialog open={archiveOpen} onOpenChange={setArchiveOpen} />
      <NewYearDialog open={newYearOpen} onOpenChange={setNewYearOpen} />
      <NewTermDialog open={newTermOpen} onOpenChange={setNewTermOpen} />
    </div>
  );
}
