import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAcademicYears, type Semester } from "@/hooks/use-academic-years";
import { toast } from "@/hooks/use-toast";

export default function NewTermDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { activeYear, createTerm } = useAcademicYears();
  const [semester, setSemester] = useState<Semester>("1st Semester");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!activeYear) return;
    setBusy(true);
    const t = await createTerm(activeYear.id, semester);
    setBusy(false);
    if (t) {
      toast({ title: "Term created", description: "Previous term (if any) was archived." });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New term</DialogTitle>
          <DialogDescription>Creates a new active term for the selected year.</DialogDescription>
        </DialogHeader>
        <RadioGroup value={semester} onValueChange={v => setSemester(v as Semester)} className="space-y-2 py-2">
          {(["1st Semester", "2nd Semester", "Summer"] as Semester[]).map(s => (
            <label key={s} className="flex items-center gap-3 border rounded p-3 cursor-pointer hover:bg-muted">
              <RadioGroupItem value={s} />
              <span>{s}</span>
            </label>
          ))}
        </RadioGroup>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
