import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAcademicYears } from "@/hooks/use-academic-years";
import { toast } from "@/hooks/use-toast";

export default function NewYearDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { years, createYear } = useAcademicYears();
  const [startYear, setStartYear] = useState<number>(new Date().getFullYear());
  const [busy, setBusy] = useState(false);

  const options = useMemo(() => {
    const now = new Date().getFullYear();
    const used = new Set(years.map(y => y.start_year));
    const out: number[] = [];
    for (let y = now; y <= now + 6; y++) if (!used.has(y)) out.push(y);
    return out;
  }, [years]);

  const submit = async () => {
    setBusy(true);
    const ay = await createYear(startYear);
    setBusy(false);
    if (ay) {
      toast({ title: "New academic year created", description: "Previous years were archived." });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New academic year</DialogTitle>
          <DialogDescription>Creating a new year will archive the current one.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label>Starting year</Label>
          <Select value={String(startYear)} onValueChange={v => setStartYear(Number(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {options.map(y => <SelectItem key={y} value={String(y)}>{y} — {y + 1}</SelectItem>)}
            </SelectContent>
          </Select>
          {options.length === 0 && <p className="text-xs text-destructive">No available future years.</p>}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={submit} disabled={busy || !options.length}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
