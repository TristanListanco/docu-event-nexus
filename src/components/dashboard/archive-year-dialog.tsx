import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useAcademicYears } from "@/hooks/use-academic-years";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function ArchiveYearDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { activeYear, archiveYear } = useAcademicYears();
  const { user } = useAuth();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const handleArchive = async () => {
    if (!activeYear || !user?.email) return;
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: user.email, password });
    if (error) {
      toast({ title: "Incorrect password", variant: "destructive" });
      setBusy(false);
      return;
    }
    const ok = await archiveYear(activeYear.id);
    setBusy(false);
    if (ok) {
      toast({ title: "Academic year archived", description: "The year is now view-only." });
      setPassword("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Archive academic year</DialogTitle>
          <DialogDescription>
            {activeYear ? `${activeYear.start_year} — ${activeYear.end_year} will become view-only.` : ""}
          </DialogDescription>
        </DialogHeader>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>All events and staff for this year will no longer be editable.</AlertDescription>
        </Alert>
        <div className="space-y-2 py-2">
          <Label>Confirm your password</Label>
          <Input type="password" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button variant="destructive" onClick={handleArchive} disabled={busy || !password}>Archive</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
