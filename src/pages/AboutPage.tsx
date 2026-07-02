import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function AboutPage() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);

  const handleClear = async () => {
    if (!user?.email) return;
    if (confirmText !== "DELETE") {
      toast({ title: "Type DELETE to confirm", variant: "destructive" });
      return;
    }
    setBusy(true);
    const { error: pwErr } = await supabase.auth.signInWithPassword({ email: user.email, password });
    if (pwErr) {
      toast({ title: "Incorrect password", variant: "destructive" });
      setBusy(false);
      return;
    }
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;
    const res = await fetch(`https://imscxfyldbrgwnsugwbp.supabase.co/functions/v1/clear-user-data`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setBusy(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast({ title: "Clear failed", description: err.error || "Try again", variant: "destructive" });
      return;
    }
    toast({ title: "All data cleared", description: "Starting fresh." });
    setOpen(false);
    window.location.href = "/onboarding";
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b">
        <div className="p-4">
          <h1 className="text-2xl font-bold tracking-tight">About</h1>
          <p className="text-muted-foreground">Information about the Documentation Committee</p>
        </div>
      </div>

      <div className="p-4 md:p-8 flex-1 overflow-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img src="/lovable-uploads/28fdac2a-08bd-48c7-82a4-242c8a1d1874.png" alt="CCS Documentation System" className="h-24 w-auto" />
            </div>
            <CardTitle className="text-3xl">Documentation Committee System</CardTitle>
            <CardDescription className="text-xl mt-2">College of Computer Studies</CardDescription>
          </CardHeader>
          <CardContent className="prose dark:prose-invert mx-auto text-center">
            <p>Created by: Tristan E. Listanco</p>
            <Separator className="my-8" />
          </CardContent>
        </Card>

        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Developer
            </CardTitle>
            <CardDescription>Destructive actions for account maintenance.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Clear all data</strong> permanently deletes every academic year, term, event, staff member, schedule, notification, and assignment tied to your account. This cannot be undone.
              </AlertDescription>
            </Alert>
            <Button variant="destructive" onClick={() => setOpen(true)}>
              <Trash2 className="h-4 w-4 mr-2" /> Clear all data
            </Button>
          </CardContent>
        </Card>

        <footer className="text-center text-muted-foreground text-sm">
          <p>This Documentation Committee is supervised by the CCS Executive Council under the regulation of the College of Computer Studies.</p>
          <p className="mt-2">© 2025 Documentation Committee. All rights reserved.</p>
          <p>College of Computer Studies, MSU-IIT</p>
        </footer>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Clear all data?</DialogTitle>
            <DialogDescription>Type <code>DELETE</code> and enter your password to permanently wipe your data.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Type DELETE</Label>
              <Input value={confirmText} onChange={e => setConfirmText(e.target.value)} placeholder="DELETE" />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
            <Button variant="destructive" onClick={handleClear} disabled={busy || !password || confirmText !== "DELETE"}>
              {busy ? "Clearing..." : "Clear all data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
